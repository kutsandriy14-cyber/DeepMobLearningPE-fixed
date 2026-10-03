IMPORT("TileRender");
IMPORT("StorageInterface");
IMPORT("EnergyNet");
IMPORT("BackpackAPI");
IMPORT("EnhancedRecipes");

const canTileBeReplaced = (function(){
    try{
        const fn = ModAPI.requireGlobal("canTileBeReplaced");
        if(typeof fn === "function") return fn;
    }
    catch(e){}
    return function(id, data){
        return World.canTileBeReplaced(id, data);
    };
})();
const Color = android.graphics.Color;
const Bitmap = android.graphics.Bitmap;
const Thread = java.lang.Thread;

const EU = EnergyTypeRegistry.assureEnergyType("Eu", 1);
const RF = EnergyTypeRegistry.assureEnergyType("RF", 0.25);

// В разных версиях Inner Core окно может передать UI.Container,
// ItemContainer, ItemContainerUIHandler или ItemContainerHandler.
// Нормализуем их перед чтением слотов.
const getDMLContainer = function(value){
    let candidate = value;
    for(let i = 0; i < 3 && candidate; i++){
        if(typeof candidate.getSlot === "function"){
            return candidate;
        }
        if(typeof candidate.asLegacyContainer === "function"){
            try{
                const legacy = candidate.asLegacyContainer();
                if(legacy && typeof legacy.getSlot === "function"){
                    return legacy;
                }
            }
            catch(e){}
        }
        if(typeof candidate.getContainer === "function"){
            try{
                candidate = candidate.getContainer();
                continue;
            }
            catch(e){}
        }
        break;
    }
    return null;
};

const getDMLSlot = function(value, name){
    const container = getDMLContainer(value);
    return container ? container.getSlot(name) : null;
};

const getDMLContainerFromClick = function(first, second){
    const candidates = [second, first];
    for(let i = 0; i < candidates.length; i++){
        const container = getDMLContainer(candidates[i]);
        if(container) return container;
    }
    return null;
};


let player = 0;
Callback.addCallback("LevelLoaded", function(){
    player = Player.get();
});

let currentScreen = "";
Callback.addCallback("NativeGuiChanged", function(screen){
    currentScreen = screen;
});


const createItem = function(namedID, name, o1, o2){
    let texture, stack;
    if(typeof o1 === "string"){
        texture = o1;
        stack = o2;
    }
    else if(typeof o1 === "number"){
        stack = o1;
    }
    const id = IDRegistry.genItemID(namedID);
    Item.createItem(namedID, name, {name: texture || namedID}, {stack: stack || 64});
    return id;
};


const DML = {
    
    is3D: __config__.getBool("3dmodel_blocks"),
    
    createBlock: function(key, name, texture){
        const id = IDRegistry.genBlockID(key);
        Block.createBlock(key, [{name: name, texture: texture, inCreative: true}]);
        if(this.is3D){
            let render = new ICRender.Model();
            let model = BlockRenderer.createModel();
            model.addBox(00/16, 00/16, 00/16,  16/16, 01/16, 16/16, "dml_machine", 0);
            model.addBox(00/16, 01/16, 00/16,  01/16, 16/16, 01/16, "dml_machine", 0);
            model.addBox(00/16, 01/16, 15/16,  01/16, 16/16, 16/16, "dml_machine", 0);
            model.addBox(15/16, 01/16, 00/16,  16/16, 16/16, 01/16, "dml_machine", 0);
            model.addBox(15/16, 01/16, 15/16,  16/16, 16/16, 16/16, "dml_machine", 0);
            model.addBox(01/16, 15/16, 00/16,  15/16, 16/16, 01/16, "dml_machine", 0);
            model.addBox(01/16, 15/16, 15/16,  15/16, 16/16, 16/16, "dml_machine", 0);
            model.addBox(00/16, 15/16, 01/16,  01/16, 16/16, 15/16, "dml_machine", 0);
            model.addBox(15/16, 15/16, 01/16,  16/16, 16/16, 15/16, "dml_machine", 0);
            render.addEntry(model);
            BlockRenderer.setStaticICRender(id, -1, render);
            render = new ICRender.Model();
            model = BlockRenderer.createTexturedBlock(texture);
            render.addEntry(model);
            ItemModel.getFor(id, -1).setModel(render);
        }
        else{
            TileRenderer.setStandartModel(id, texture);
            TileRenderer.registerRotationModel(id, 0, texture);
        }
        ToolAPI.registerBlockMaterial(id, "stone", 1);
        Block.setDestroyTime(id, 3);
    },
    
    model: {},
    registerInsideModel: function(id, model){
        if(!this.is3D){
            return;
        }
        this.model[id] = [];
        model.forEach(function(box){
            box.type = "box";
            box.coords.x += box.size.x / 2;
            box.coords.y += box.size.y / 2;
            box.coords.z += box.size.z / 2;
        });
        const direction = [Math.PI, 0, Math.PI / 2, -Math.PI / 2];
        let render;
        for(let i = 0; i < 4; i++){
            render = new Render();
            render.getPart("head").addPart("sub");
            render.setPart("sub", model, {rotation: {y: direction[i]}, width: 64, height: 64});
            this.model[id][i] = render.getID();
        }
    },
    
    getInsideModel: function(id, data){
        return this.model[id][data];
    },
    
    registerMachine: function(key, prototype){
        const id = BlockID[key];
        if(this.is3D){
            prototype.anim = null;
            prototype.init = function(){
                this.anim = new Animation.Base(this.x + 0.5, this.y - 0.375, this.z + 0.5);
                this.anim.describe({render: DML.getInsideModel(this.blockID, this.data.meta), skin: "model/" + key + ".png", scale: 0.875});
                this.anim.load();
                this.anim.setSkylightMode();
            };
            prototype.destroy = function(){
                this.anim.destroy();
            };
            Block.registerPlaceFunction(id, function(coords, item, block, player, region){
                region = region || BlockSource.getDefaultForActor(player);
                const place = canTileBeReplaced(block.id, block.data) ? coords : coords.relative;
                region.setBlock(place.x, place.y, place.z, item.id, item.data);
                const tile = World.addTileEntity(place.x, place.y, place.z, region);
                // новый TileRenderer.getBlockRotation(player, hasVertical) возвращает 2..5, старый 0..3
                tile && (tile.data.meta = TileRenderer.getBlockRotation(player, false) - 2);
                return place;
            });
        }
        else{
            prototype.init = function(){
                TileRenderer.mapAtCoords(this.x, this.y, this.z, this.blockID, this.data.meta);
                delete this.liquidStorage;
            };
            prototype.destroy = function(){
                BlockRenderer.unmapAtCoords(this.x, this.y, this.z);
            };
            TileRenderer.setRotationPlaceFunction(id);
        }
        prototype.energyReceive = function(type, amount){
            const ratio = EnergyTypeRegistry.getValueRatio(type, "RF");
            const add = Math.min(25600, amount * ratio, this.getEnergyStorage() - this.data.energy);
            this.data.energy += add;
            return add / ratio | 0;
        };
        TileEntity.registerPrototype(id, prototype);
        EnergyTileRegistry.addEnergyTypeForId(id, EU);
        EnergyTileRegistry.addEnergyTypeForId(id, RF);
    }
    
};


const validResult = function(){
    return false;
};
