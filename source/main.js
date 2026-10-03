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


createItem("charred_redstone", "Soot-covered Redstone");

Item.registerNameOverrideFunction(ItemID.charred_redstone, function(item, name){
    return name + "\n§7Crafted by crushing §c" + Item.getName(VanillaItemID.redstone) + " §7against a §f" + Item.getName(VanillaBlockID.coal_block) + " §7(long tap)";
});

Callback.addCallback("DestroyBlockStart", function(coords, block){
    if(block.id === VanillaBlockID.coal_block && Player.getCarriedItem().id === VanillaItemID.redstone){
        Player.decreaseCarriedItem();
        World.drop(coords.x + 0.5, coords.y + 1, coords.z + 0.5, ItemID.charred_redstone, 1, 0);
        Particles.addParticle(Native.ParticleType.smoke, coords.x + 0.5, coords.y + 1, coords.z + 0.5, 0, 0, 0);
    }
});

createItem("charred_plate", "Soot-covered Plate");
Recipes2.addShapeless({id: ItemID.charred_plate, count: 8}, [ItemID.charred_redstone, {id: VanillaBlockID.obsidian, count: 3}]);

IDRegistry.genBlockID("charred_machine");
Block.createBlock("charred_machine", [{name: "Soot-covered Machine Casing", texture: [["charred_machine", 0]], inCreative: true}]);
Recipes2.addShaped(BlockID.charred_machine, "aba:bcb:aba", {a: ItemID.charred_plate, b: VanillaItemID.iron_ingot, c: ItemID.charred_redstone});

createItem("polymer_clay", "Polymer Clay");
Recipes2.addShaped({id: ItemID.polymer_clay, count: 16}, "ab_:bcb:_bd", {a: VanillaItemID.gold_ingot, b: VanillaItemID.clay_ball, c: {id: VanillaItemID.dye, data: 4}, d: VanillaItemID.iron_ingot});


const MatterParams = {

    data: {},

    register: function(id, xp, multiplier, operations){
        this.data[id] = {xp: xp, multiplier: multiplier - 1, operations: operations};
    },

    isMatter: function(id){
        return id in this.data;
    },

    getXp: function(id){
        return this.data[id] ? this.data[id].xp : 0;
    },

    getMultiplier: function(id){
        return this.data[id] ? this.data[id].multiplier : 0;
    },

    getOperations: function(id){
        return this.data[id] ? this.data[id].operations : 0;
    }

};

const matterUseFunction = function(coords, item){
    const count = Entity.getSneaking(player) ? item.count : 1;
    Player.addExperience(MatterParams.getXp(item.id) * count);
    Player.decreaseCarriedItem(count);
};

createItem("matter_overworld", "Overworldian Matter");
Item.registerUseFunction("matter_overworld", matterUseFunction);
MatterParams.register(ItemID.matter_overworld, 10, 2.2, 10);

createItem("matter_hell", "Hellish Matter");
Item.registerUseFunction("matter_hell", matterUseFunction);
Recipes2.addShaped(ItemID.matter_hell, "_a_:aba:_a_", {a: ItemID.matter_overworld, b: VanillaBlockID.netherrack});
MatterParams.register(ItemID.matter_hell, 14, 2.4, 10);

createItem("matter_extra", "Extraterrestrial Matter");
Item.registerUseFunction("matter_extra", matterUseFunction);
Recipes2.addShaped(ItemID.matter_extra, "_a_:aba:_a_", {a: ItemID.matter_hell, b: VanillaBlockID.end_stone});
MatterParams.register(ItemID.matter_extra, 20, 2.7, 10);

Item.addCreativeGroup("dml_matter", "Mob Matters", [ItemID.matter_overworld, ItemID.matter_hell, ItemID.matter_extra]);


Callback.addCallback("PreLoaded", function(){
    if(__config__.getBool("matter_recipe")){
        Recipes2.addShapeless({id: VanillaBlockID.web, count: 4}, [VanillaItemID.string, VanillaItemID.slime_ball, {id: ItemID.matter_overworld, count: 2}]);
        Recipes2.addShapeless({id: VanillaItemID.gunpowder, count: 16}, [ItemID.matter_overworld, {id: VanillaItemID.coal, data: 0}]);
        Recipes2.addShapeless({id: VanillaItemID.spider_eye, count: 2}, [VanillaItemID.rotten_flesh, VanillaItemID.apple, VanillaBlockID.red_mushroom, ItemID.matter_overworld]);
        Recipes2.addShapeless({id: VanillaItemID.arrow, count: 12}, [VanillaItemID.stick, VanillaItemID.flint, ItemID.matter_overworld]);
        Recipes2.addShapeless({id: VanillaItemID.bone, count: 22}, [ItemID.matter_overworld, {id: VanillaItemID.dye, data: 15}]);
        Recipes2.addShapeless({id: VanillaItemID.iron_ingot, count: 8}, [{id: ItemID.matter_overworld, count: 4}, VanillaItemID.rotten_flesh]);
        Recipes2.addShapeless({id: VanillaItemID.rotten_flesh, count: 16}, [ItemID.matter_overworld, VanillaItemID.porkchop]);
        Recipes2.addShapeless({id: VanillaItemID.potato, count: 2}, [ItemID.matter_overworld, VanillaItemID.carrot]);
        Recipes2.addShapeless({id: VanillaItemID.carrot, count: 2}, [ItemID.matter_overworld, VanillaBlockID.wheat]);
        Recipes2.addShapeless({id: VanillaItemID.prismarine_shard, count: 2}, [ItemID.matter_overworld, VanillaItemID.quartz]);
        Recipes2.addShapeless({id: VanillaBlockID.grass, count: 4}, [VanillaBlockID.dirt, VanillaBlockID.leaves, ItemID.matter_overworld]);
        Recipes2.addShapeless({id: VanillaBlockID.nether_wart, count: 4}, [ItemID.matter_hell, VanillaBlockID.red_mushroom]);
        Recipes2.addShapeless({id: VanillaItemID.gold_ingot, count: 6}, [VanillaItemID.glowstone_dust, VanillaItemID.iron_ingot, ItemID.matter_hell]);
        Recipes2.addShapeless({id: VanillaItemID.ghast_tear, count: 3}, [VanillaItemID.spider_eye, VanillaItemID.sugar, {id: ItemID.matter_hell, count: 2}]);
        Recipes2.addShapeless(VanillaItemID.blaze_rod, [VanillaItemID.bone, {id: ItemID.matter_hell, count: 2}]);
        Recipes2.addShapeless({id: VanillaItemID.blaze_powder, count: 2}, [ItemID.matter_hell, VanillaItemID.gunpowder]);
        Recipes2.addShapeless({id: VanillaBlockID.soul_sand, count: 4}, [ItemID.matter_hell, VanillaBlockID.sand]);
        Recipes2.addShapeless(VanillaItemID.chorus_fruit, [ItemID.matter_extra, VanillaItemID.apple]);
        Recipes2.addShaped(VanillaItemID.netherstar, "aba:ccc:_c_", {a: {id: VanillaBlockID.skull, data: 1}, b: ItemID.matter_extra, c: VanillaBlockID.soul_sand});
        Recipes2.addShapeless(VanillaItemID.ender_pearl, [ItemID.matter_extra, VanillaItemID.emerald, VanillaItemID.snowball, VanillaItemID.slime_ball]);
        Recipes2.addShapeless({id: VanillaBlockID.end_stone, count: 8}, [{id: VanillaBlockID.sandstone, count: 2}, VanillaItemID.ender_pearl, ItemID.matter_extra]);  
    }
});

IDRegistry.genItemID("datamodel_blank");
Item.createItem("datamodel_blank", "Blank Data Model", {name: "datamodel_blank"});
Item.addCreativeGroup("dml_datamodel", "Data Models", [ItemID.datamodel_blank]);
Recipes2.addShaped(ItemID.datamodel_blank, "aba:cdc:aea", {a: {id: 351, data: 4}, b: 356, c: ItemID.charred_redstone, d: {id: 1, data: 0}, e: 266});


const extractionRecipe = {};

const DataModel = {
    
    data: {},
    
    needData: [6, 48, 300, 900],
    // Индексы 0..3 — Faulty..Superior, индекс 4 — Self Aware.
    // На максимальном уровне Pristine Matter выпадает гарантированно.
    chance: [0.05, 0.11, 0.24, 0.42, 1.0],
    dataPerKill: [1, 4, 10, 18],

    TYPE_OVER: 0,
    TYPE_HELL: 1,
    TYPE_EXTRA: 2,
    
    typeName: ["Overworldian", "Hellish", "Extraterrestrial"],//acd
    tierName: ["Faulty", "Basic", "Advanced", "Superior", "Self Aware"],//8a9d6
    
    nameOverride: function(item, name){
        const datamodel = DataModel.getData(item.id);
        const tier = DataModel.getTier(item.data);
        let name2 = name;
        name2 += "\n§fTier: " + DataModel.tierName[tier];
        if(tier < 4){
            name2 += "\nData collected: " + DataModel.getCollectedData(item.data) + " / " + DataModel.needData[tier];
            name2 += "\nData per kill: " + DataModel.dataPerKill[tier];
        }
        name2 += "\nSimulation cost: " + datamodel.cost + " RF/t";
        name2 += "\nType: " + DataModel.typeName[datamodel.type];
        return name2;
    },
    
    registerMob: function(key, obj){
        const name = obj.name || key.charAt(0).toUpperCase() + key.slice(1);
        const datamodel = createItem("datamodel_" + key, "§b" + name + " Data Model", 1);
        const pristine = createItem("pristine_" + key, "Pristine " + name + " Matter");
        Item.addCreativeGroup("dml_datamodel", "Data Models", [datamodel]);
        Item.addCreativeGroup("dml_pristine", "Pristine Matters", [pristine]);
        Item.registerNameOverrideFunction(datamodel, this.nameOverride);
        Item.setGlint(pristine, true);
        const words = obj.info.split(" ");
        const textArray = [];
        let text = "";
        for(let i = 0; i < words.length; i++){
            if(text.length + words[i].length < 30){
                text += words[i] + " ";
            }
            else{
                textArray.push(text);
                text = "";
            }
        }
        text && textArray.push(text);
        this.data[datamodel] = {
            key: key,
            name: name,
            entity: obj.entity,
            type: obj.type,
            cost: obj.cost,
            life: obj.life,
            pristine: pristine,
            loot: obj.loot.slice(),
            info: textArray.join("\n")
        };
        obj.recipeItem && Recipes2.addShapeless(datamodel, [obj.recipeItem, ItemID.datamodel_blank]);
        extractionRecipe[pristine] = obj.loot.map(function(item){
            return {id: item.id, count: item.count, data: item.data || 0, chance: item.chance === undefined ? 1 : item.chance};
        });
    },
    
    addLootItem: function(key){
        for(let id in this.data){
            if(this.data[id].key === key){
                for(let i = 1; i < arguments.length; i++){
                    this.data[id].loot.push(arguments[i]);
                    extractionRecipe[this.data[id].pristine].push({
                        id: arguments[i].id,
                        count: arguments[i].count,
                        data: arguments[i].data || 0,
                        chance: arguments[i].chance === undefined ? 1 : arguments[i].chance
                    });
                }
                break;
            }
        }
    },
    
    getData: function(id){
        return this.data[id];
    },
    
    isDataModel: function(id){
        return id in this.data;
    },
    
    getTier: function(data){
        let total = 0;
        for(let i = 0; i < 4; i++){
            total += this.needData[i];
            if(data < total){
                return i;
            }
        }
        return 4;
    },
    
    getCollectedData: function(data){
        const tier = this.getTier(data);
        for(let i = 0; i < tier; i++){
            data -= this.needData[i];
        }
        return data;
    },
    
    matter: [ItemID.matter_overworld, ItemID.matter_hell, ItemID.matter_extra],
    getMatter: function(type){
        return this.matter[type];
    }
    
};


DataModel.registerMob("zombie", {
    entity: Native.EntityType.ZOMBIE || 32,
    type: DataModel.TYPE_OVER,
    cost: 80,
    life: 10,
    loot: [{id: VanillaItemID.rotten_flesh, count: 16}, {id: VanillaItemID.iron_ingot, count: 1}, {id: VanillaItemID.carrot, count: 2}, {id: VanillaItemID.potato, count: 2}],
    info: "They go moan in the night. Does not understand the need for personal space",
    recipeItem: VanillaItemID.rotten_flesh
});

DataModel.registerMob("skeleton", {
    entity: Native.EntityType.SKELETON || 34,
    type: DataModel.TYPE_OVER,
    cost: 80,
    life: 10,
    loot: [{id: VanillaItemID.bone, count: 4}, {id: VanillaItemID.arrow, count: 8}, {id: VanillaBlockID.skull, count: 1}],
    info: "A formidable archer, which seem to be running some sort of cheat engine A shield could prove useful",
    recipeItem: VanillaItemID.bone
});

DataModel.registerMob("creeper", {
    entity: Native.EntityType.CREEPER || 33,
    type: DataModel.TYPE_OVER,
    cost: 80,
    life: 10,
    loot: [{id: VanillaItemID.gunpowder, count: 2}, {id: VanillaBlockID.skull, count: 1, data: 4}],
    info: "Will blow up your base if left unattended.",
    recipeItem: VanillaItemID.gunpowder
});

DataModel.registerMob("spider", {
    entity: Native.EntityType.SPIDER || 35,
    type: DataModel.TYPE_OVER,
    cost: 80,
    life: 8,
    loot: [{id: VanillaItemID.spider_eye, count: 4}, {id: VanillaItemID.string, count: 16}, {id: VanillaBlockID.web, count: 2}],
    info: "Nocturnal douchebags, beware Drops strands of string for some reason..",
    recipeItem: VanillaItemID.spider_eye
});

DataModel.registerMob("slime", {
    entity: Native.EntityType.SLIME || 37,
    type: DataModel.TYPE_OVER,
    cost: 150,
    life: 8,
    loot: [{id: VanillaItemID.slime_ball, count: 8}],
    info: "The bounce bounce his bounce squish - \"A slime haiku\"",
    recipeItem: VanillaItemID.slime_ball
});

DataModel.registerMob("witch", {
    entity: Native.EntityType.WITCH || 45,
    type: DataModel.TYPE_OVER,
    cost: 120,
    life: 13,
    loot: [{id: VanillaItemID.redstone, count: 8}, {id: VanillaItemID.glowstone_dust, count: 8}, {id: VanillaItemID.sugar, count: 16}],
    info: "Affinity with potions and concoctions Beware!",
    recipeItem: 374
});

DataModel.registerMob("blaze", {
    entity: Native.EntityType.BLAZE || 43,
    type: DataModel.TYPE_HELL,
    cost: 256,
    life: 10,
    loot: [{id: VanillaItemID.blaze_rod, count: 4}],
    info: "Bring buckets, and watch in despair as it evaporates, and everything is on fire You are on fire",
    recipeItem: VanillaItemID.blaze_powder
});

DataModel.registerMob("ghast", {
    entity: Native.EntityType.GHAST || 41,
    type: DataModel.TYPE_HELL,
    cost: 372,
    life: 5,
    loot: [{id: VanillaItemID.ghast_tear, count: 2}],
    info: "If you hear something that sounds like a crying llama, you're probably hearing a ghast",
    recipeItem: VanillaItemID.ghast_tear
});

DataModel.registerMob("skeleton2", {
    name: "Wither Skeleton",
    entity: Native.EntityType.WITHER_SKELETON || 48,
    type: DataModel.TYPE_HELL,
    cost: 880,
    life: 10,
    loot: [{id: VanillaBlockID.skull, count: 1, data: 1}, {id: 263, count: 5}],
    info: "Inflicts the wither effect Bring milk",
    recipeItem: {id: VanillaBlockID.skull, data: 1}
});

DataModel.registerMob("enderman", {
    entity: Native.EntityType.ENDERMAN || 38,
    type: DataModel.TYPE_EXTRA,
    cost: 512,
    life: 20,
    loot: [{id: VanillaItemID.ender_pearl, count: 2}, {id: VanillaItemID.end_crystal, count: 1}],
    info: "Friendly unless provoked, dislikes rain. Teleports short distances",
    recipeItem: VanillaItemID.ender_pearl
});

DataModel.registerMob("wither", {
    entity: Native.EntityType.WITHER || 52,
    type: DataModel.TYPE_EXTRA,
    cost: 2048,
    life: 150,
    loot: [{id: VanillaItemID.netherstar, count: 1}],
    info: "Do not approach this enemy. Run! I mean it has 3 heads, what could possibly go wrong?",
    recipeItem: VanillaItemID.netherstar
});

DataModel.registerMob("dragon", {
    name: "Ender Dragon",
    entity: Native.EntityType.ENDER_DRAGON || 53,
    type: DataModel.TYPE_EXTRA,
    cost: 2560,
    life: 100,
    loot: [{id: VanillaItemID.dragon_breath, count: 8}, {id: VanillaBlockID.dragon_egg, count: 1}],
    info: "Resides in the end, does not harbor treasure Destroy it's crystals, break the cycle.",
    recipeItem: VanillaBlockID.dragon_egg
});

DataModel.registerMob("shulker", {
    entity: Native.EntityType.SHULKER || 54,
    type: DataModel.TYPE_EXTRA,
    cost: 256,
    life: 15,
    loot: [{id: VanillaItemID.shulker_shell, count: 2}, {id: VanillaItemID.diamond, count: 1}],
    info: "Found in End cities Sneaky little buggers",
    recipeItem: VanillaItemID.shulker_shell
});

DataModel.registerMob("guardian", {
    entity: Native.EntityType.GUARDIAN || 49,
    type: DataModel.TYPE_OVER,
    cost: 340,
    life: 15,
    loot: [{id: VanillaItemID.prismarine_shard, count: 16}, {id: VanillaItemID.prismarine_crystals, count: 8}, {id: VanillaItemID.fish, count: 16}],
    info: "Lurking in the oceans. Uses some sort of sonar beam as a means of attack",
    recipeItem: VanillaItemID.prismarine_shard
});


createItem("deep_learner", "Deep Learner", 1);
Recipes2.addShaped(ItemID.deep_learner, "aba:bcb:ada", {a: ItemID.charred_plate, b: VanillaItemID.repeater, c: VanillaBlockID.glass_pane, d: ItemID.charred_redstone});


const fontPopup = {color: Color.WHITE, size: 80, shadow: 0.5};
const fontPopupSmall = {color: Color.WHITE, size: 60, shadow: 0.5};


const validDataModel = function(id){
    return DataModel.isDataModel(id);
};

const Learner = {
    
    page: 0,
    
    window: new UI.StandartWindow({
        standart: {
            header: {text: {text: "Deep Learner"}},
            inventory: {standart: true, width: 240, padding: 20},
            background: {standart: true}
        },
        params: {slot: "dml.slot_dark"},
        drawing: [
            {type: "bitmap", x: 300, y: 40, bitmap: "dml.learner", scale: 2},
            {type: "frame", x: 460, y: 40, width: 512, height: 280, bitmap: "dml.frame_blue", bg: Color.parseColor("#111111"), scale: 2},//256,140
        ],
        elements: {
            slot0: {type: "slot", x: 890, y: 238, size: 36, isValid: validDataModel},
            slot1: {type: "slot", x: 926, y: 238, size: 36, isValid: validDataModel},
            slot2: {type: "slot", x: 890, y: 274, size: 36, isValid: validDataModel},
            slot3: {type: "slot", x: 926, y: 274, size: 36, isValid: validDataModel},
            imageMob: {type: "image", x: 300, y: 40, width: 150, height: 202, bitmap: "_default_slot_empty"},
            textInfo: {type: "text", x: 470, y: 50, multiline: true, font: {color: Color.WHITE, size: 24}},
            buttonL: {type: "button", x: 330, y: 250, bitmap: "dml.buttonL", scale: 2, clicker: {
                onClick: function(first, second){
                    const container = getDMLContainerFromClick(first, second);
                    if(!container) return;
                    for(let i = 0; i < 4; i++){
                        Learner.page++;
                        Learner.page &= 3;
                        const slot = getDMLSlot(container, "slot" + Learner.page);
                        if(slot && DataModel.isDataModel(slot.id)){
                            Learner.refreshWindow(container);
                            break;
                        }
                    }
                }
            }},
            buttonR: {type: "button", x: 380, y: 250, bitmap: "dml.buttonR", scale: 2, clicker: {
                onClick: function(first, second){
                    const container = getDMLContainerFromClick(first, second);
                    if(!container) return;
                    for(let i = 0; i < 4; i++){
                        Learner.page--;
                        Learner.page &= 3;
                        const slot = getDMLSlot(container, "slot" + Learner.page);
                        if(slot && DataModel.isDataModel(slot.id)){
                            Learner.refreshWindow(container);
                            break;
                        }
                    }
                }
            }},
        }
    }),
    
    refreshWindow: function(container){
        const content = this.window.getContent();
        const elements = this.window.getElements();
        const slot = getDMLSlot(container, "slot" + this.page);
        if(!slot) return;
        const chip = DataModel.getData(slot.id);
        const tier = DataModel.getTier(slot.data);
        const collected = DataModel.getCollectedData(slot.data) / DataModel.dataPerKill[tier] | 0;
        content.elements.imageMob.bitmap = chip ? "dml.mob_" + chip.key : "_default_slot_empty";
        elements.get("textInfo").onBindingUpdated("text", chip ? "Name\nThe " + chip.name + "\nInformation\n" + chip.info + "\n\nModel Tier: " + DataModel.tierName[tier] + "\n" + chip.name + "s defeated: " + collected + (tier === 4 ? "Maximum tier achieved" : "\nDefeat " + (DataModel.needData[tier] / DataModel.dataPerKill[tier] - collected) + " more to reach " + DataModel.tierName[tier + 1]) : "");
    },
    
    popupWindow: new UI.Window({
        location: {x: 0, y: 0, width: 240, height: 240},
        params: {slot: "_default_slot_empty"},
        drawing: [{type: "background", color: Color.TRANSPARENT}],
        elements: {
            textTier0: {type: "text", x: 40, y: 0, font: fontPopup},
            textTier1: {type: "text", x: 40, y: 240, font: fontPopup},
            textTier2: {type: "text", x: 40, y: 480, font: fontPopup},
            textTier3: {type: "text", x: 40, y: 720, font: fontPopup},
            slot0: {type: "slot", x: -20, y: 50, visual: true, isDarkenAtZero: false, needClean: true, size: 240},
            slot1: {type: "slot", x: -20, y: 290, visual: true, isDarkenAtZero: false, needClean: true, size: 240},
            slot2: {type: "slot", x: -20, y: 530, visual: true, isDarkenAtZero: false, needClean: true, size: 240},
            slot3: {type: "slot", x: -20, y: 770, visual: true, isDarkenAtZero: false, needClean: true, size: 240},
            scaleBack0: {type: "image", x: 220, y: 120, bitmap: "dml.scale_xp_back", scale: 8},
            scaleBack1: {type: "image", x: 220, y: 360, bitmap: "dml.scale_xp_back", scale: 8},
            scaleBack2: {type: "image", x: 220, y: 600, bitmap: "dml.scale_xp_back", scale: 8},
            scaleBack3: {type: "image", x: 220, y: 840, bitmap: "dml.scale_xp_back", scale: 8},
            scaleXp0: {type: "scale", x: 228, y: 128, z: 1, width: 696, height: 80, bitmap: "dml.scale_progress"},
            scaleXp1: {type: "scale", x: 228, y: 368, z: 1, width: 696, height: 80, bitmap: "dml.scale_progress"},
            scaleXp2: {type: "scale", x: 228, y: 608, z: 1, width: 696, height: 80, bitmap: "dml.scale_progress"},
            scaleXp3: {type: "scale", x: 228, y: 848, z: 1, width: 696, height: 80, bitmap: "dml.scale_progress"},
            textNext0:  {type: "text", x: 240, y: 130, z: 2, font: fontPopupSmall},
            textNext1:  {type: "text", x: 240, y: 370, z: 2, font: fontPopupSmall},
            textNext2:  {type: "text", x: 240, y: 610, z: 2, font: fontPopupSmall},
            textNext3:  {type: "text", x: 240, y: 850, z: 2, font: fontPopupSmall}
        }
    })
    
};


Learner.window.getWindow("main").setEventListener({onOpen: function(window){
    Learner.refreshWindow(window.getContainer());
}});

Learner.popupWindow.setAsGameOverlay(true);


BackpackRegistry.register(ItemID.deep_learner, {
    slots: 4,
    gui: Learner.window
});


Callback.addCallback("EntityDeath", function(entity, attacker){
    let isPlayer = false;
    try{
        isPlayer = Entity.getType(attacker) === Native.EntityType.PLAYER;
    }
    catch(e){}
    if(!isPlayer){
        try{
            isPlayer = Player.isPlayer(attacker);
        }
        catch(e){}
    }
    if(!isPlayer){
        return;
    }
    const entityType = Entity.getType(entity);
    let i = 0, j = 0, tier = 0, tier2 = 0;
    let inv, container, slot, chip;
    const playerActor = new PlayerActor(attacker);
    const processLearner = function(inv){
        if(!inv || inv.id !== ItemID.deep_learner){
            return;
        }
        container = BackpackRegistry.containers["d" + inv.data];
        if(!container){
            return;
        }
        for(j = 0; j < 4; j++){
            slot = getDMLSlot(container, "slot" + j);
            if(!slot) continue;
            chip = DataModel.getData(slot.id);
            tier = DataModel.getTier(slot.data);
            if(chip && chip.entity === entityType && tier < 4){
                slot.data += DataModel.dataPerKill[tier];
                if(typeof slot.markDirty === "function"){
                    slot.markDirty();
                }
                if(typeof container.sendChanges === "function"){
                    container.sendChanges();
                }
                tier2 = DataModel.getTier(slot.data);
                tier !== tier2 && Game.message(chip.name + " Data Model reached the " + DataModel.tierName[tier2] + " tier");
            }
        }
    };

    // PlayerActor — серверный способ чтения инвентаря игрока; слоты 0..36.
    for(i = 0; i <= 36; i++){
        processLearner(playerActor.getInventorySlot(i));
    }
    // Дополнительно учитываем Deep Learner в левой руке.
    try{
        processLearner(Entity.getOffhandItem(attacker));
    }
    catch(e){}
});


const elementsPopup = Learner.popupWindow.getElements();
Callback.addCallback("LevelLoaded", function(){
    Updatable.addUpdatable({update: function(){
        const carried = Player.getCarriedItem();
        if((currentScreen === "hud_screen" || currentScreen === "in_game_play_screen") && carried.id === ItemID.deep_learner){
            const container = BackpackRegistry.containers["d" + carried.data];
            if(container){
                let slot;
                let flag = false;
                let tier = 0, corrected = 0, need = 0;
                Learner.popupWindow.open();
                for(let i = 0; i < 4; i++){
                    slot = getDMLSlot(container, "slot" + i);
                    if(!slot) continue;
                    flag = DataModel.isDataModel(slot.id);
                    tier = DataModel.getTier(slot.data);
                    corrected = DataModel.getCollectedData(slot.data) / DataModel.dataPerKill[tier] | 0;
                    need = DataModel.needData[tier] / DataModel.dataPerKill[tier];
                    elementsPopup.get("textTier" + i).onBindingUpdated("text", flag ? DataModel.tierName[DataModel.getTier(slot.data)] + " Model" : "");
                    elementsPopup.get("slot" + i).onBindingUpdated("source", {id: flag ? slot.id : 0, count: 0, data: 0});
                    elementsPopup.get("scaleBack" + i).setPosition(220, flag ? i * 240 + 120 : -200);
                    elementsPopup.get("scaleXp" + i).onBindingUpdated("value", flag ? tier === 4 ? 1 : corrected / need : 0);
                    elementsPopup.get("textNext" + i).onBindingUpdated("text", flag && tier < 4 ? (need - corrected) + " to go" : "");
                }
                return;
            }
        }
        Learner.popupWindow.close();
    }});
});


DML.createBlock("simulation_chamber", "Simulation Chamber", [
    ["dml_machine", 0],
    ["dml_machine", 0],
    ["simulation_chamber", 0],
    ["simulation_chamber", 1],
    ["simulation_chamber", 0],
    ["simulation_chamber", 0]
]);

Recipes2.addShaped(BlockID.simulation_chamber, "_a_:bcb:ded", {
    a: VanillaBlockID.glass_pane,
    b: VanillaItemID.ender_pearl,
    c: BlockID.charred_machine,
    d: {id: VanillaItemID.dye, data: 4},
    e: VanillaItemID.comparator
});


DML.registerInsideModel(BlockID.simulation_chamber, [
    {uv: {x: 0, y: 0}, coords: {x: -8, y: 0, z: -8}, size: {x: 16, y: 16, z: 16}},
    {uv: {x: 0, y: 32}, coords: {x: -7, y: 1, z: -9}, size: {x: 14, y: 1, z: 1}},
    {uv: {x: 0, y: 32}, coords: {x: -7, y: 2, z: -9}, size: {x: 1, y: 13, z: 1}},
    {uv: {x: 0, y: 48}, coords: {x: 6, y: 2, z: -9}, size: {x: 1, y: 13, z: 1}},
    {uv: {x: 0, y: 48}, coords: {x: -6, y: 14, z: -9}, size: {x: 12, y: 1, z: 1}},
    {uv: {x: 32, y: 62}, coords: {x: -5, y: 12, z: -9}, size: {x: 7, y: 1, z: 1}},
    {uv: {x: 48, y: 62}, coords: {x: 3, y: 12, z: -9}, size: {x: 2, y: 1, z: 1}},
    {uv: {x: 32, y: 32}, coords: {x: -9, y: 3, z: 2}, size: {x: 1, y: 1, z: 3}},
    {uv: {x: 32, y: 48}, coords: {x: -9, y: 3, z: -5}, size: {x: 1, y: 1, z: 4}},
    {uv: {x: 43, y: 32}, coords: {x: 8, y: 3, z: -5}, size: {x: 1, y: 1, z: 3}},
    {uv: {x: 43, y: 48}, coords: {x: 8, y: 3, z: 1}, size: {x: 1, y: 1, z: 4}},
    {uv: {x: 54, y: 32}, coords: {x: 2, y: 3, z: 8}, size: {x: 3, y: 1, z: 1}},
    {uv: {x: 54, y: 48}, coords: {x: -5, y: 3, z: 8}, size: {x: 4, y: 1, z: 1}}
]);


const windowSimulation = new UI.StandartWindow({
    standart: {
        header: {text: {text: "Simulation Chamber"}},
        inventory: {standart: true, width: 240, padding: 20},
        background: {standart: true}
    },
    drawing: [
        {type: "frame", x: 340, y: 40, width: 648, height: 423, bitmap: "dml.frame_blue", bg: Color.rgb(17, 17, 17), scale: 3},//216,141
        {type: "frame", x: 355, y: 55, width: 462, height: 120, bitmap: "dml.frame_dark", bg: Color.BLACK, scale: 3},//5,5, 154,40
        {type: "frame", x: 355, y: 181, width: 27, height: 267, bitmap: "dml.frame_dark", bg: Color.BLACK, scale: 3},//5,47, 9,89
        {type: "frame", x: 388, y: 181, width: 549, height: 267, bitmap: "dml.frame_dark", bg: Color.BLACK, scale: 3},//16,47, 183,89
        {type: "frame", x: 946, y: 181, width: 27, height: 267, bitmap: "dml.frame_dark", bg: Color.BLACK, scale: 3},//202,47, 9,89
    ],
    elements: {
        scaleData: {type: "scale", x: 358, y: 184, width: 21, height: 261, direction: 1, bitmap: "dml.scale_energy"},
        scaleEnergy: {type: "scale", x: 949, y: 184, width: 21, height: 261, direction: 1, bitmap: "dml.scale_progress"},
        slotChip: {type: "slot", x: 277, y: 40, size: 54, bitmap: "dml.slot_chip", isValid: function(id){return DataModel.isDataModel(id);}},
        slotSource: {type: "slot", x: 841, y: 58, size: 54, bitmap: "dml.slot_i", isValid: function(id){return id === ItemID.polymer_clay;}},//167,6
        slotResult: {type: "slot", x: 901, y: 58, size: 54, bitmap: "dml.slot_dark", isValid: validResult},//187,6
        slotPristine: {type: "slot", x: 871, y: 118, size: 54, bitmap: "dml.slot_E", isValid: validResult},//177,26
        textInfo: {type: "text", x: 365, y: 65, multiline: true, font: {color: Color.WHITE, size: 24}},
        textSimulation: {type: "text", x: 398, y: 191, multiline: true, font: {color: Color.WHITE, size: 24}},
        textProgress: {type: "text", x: 920, y: 410, font: {color: Color.rgb(0, 170, 170), size: 24, alignment: 2}}
    }
});


DML.registerMachine("simulation_chamber", {
    
    defaultValues: {
        meta: 0,
        energy: 0,
        progress: -1,
        pristine: false
    },
    
    textString: "",
    textPosition: 0,
    
    getGuiScreen: function(){
        return windowSimulation;
    },
    
    animateText: function(key, string){
        if(this.data.progress === -1 && !this.container.isOpened()){
            this.textPosition = 0;
            return;
        }
        if(this.textString === string){
            const array = string.split("\n");
            let position = ++this.textPosition;
            let text = ""
            for(let i = 0; i < array.length; i++){
                if(position <= array[i].length){
                    text += array[i].slice(0, position);
                    break;
                }
                position -= array[i].length;
                text += array[i] + "\n";
            }
            this.container.setText(key, text);
        }
        else{
            this.textString = string;
            this.textPosition = 0;
        }
    },
    
    hasSpace: function(slot, id){
        return slot.id === 0 || slot.id === id && slot.count < 64;
    },
    
    tick: function(){
        
        const slotChip = this.container.getSlot("slotChip");
        const slotResult = this.container.getSlot("slotResult");
        const slotPristine = this.container.getSlot("slotPristine");
        const chip = DataModel.getData(slotChip.id);
        const tier = DataModel.getTier(slotChip.data);
        const result = chip ? DataModel.getMatter(chip.type) : 0;
        
        startSimulation:
        if(this.data.progress === -1){
            const slotSource = this.container.getSlot("slotSource");
            this.container.setText("textProgress", "");
            if(!chip){
                this.animateText("textInfo", "Please insert a data model\nto bigin the simulation");
                this.container.setText("textSimulation", "");
                break startSimulation;
            }
            if(tier === 0){
                this.animateText("textInfo", "Insufficient data in model\nplease insert a basic model\nor better");
                this.container.setText("textSimulation", "");
                break startSimulation;
            }
            this.container.setText("textInfo",
                "Tier: " + DataModel.tierName[tier] +
                "\nIterations: " + slotChip.data +
                "\nPristine chance: " + (DataModel.chance[tier] * 100) + "%"
            );
            if(slotSource.id !== ItemID.polymer_clay){
                this.animateText("textSimulation", "Cannot begin simulation\nMissing polymer clay");
                break startSimulation;
            }
            if(this.data.energy < chip.cost * 300){
                this.animateText("textSimulation", "Cannot begin simulation\nSystem energy levels critical");
                break startSimulation;
            }
            if(!this.hasSpace(slotResult, result) || !this.hasSpace(slotPristine, chip.pristine)){
                this.animateText("textSimulation", "Cannot begin simulation\nOutput or pristine buffer is full");
                break startSimulation;
            }
            slotSource.count--;
            this.container.validateSlot("slotSource");
            this.data.progress = 0;
            this.data.pristine = Math.random() < DataModel.chance[tier];
        }
        else{
            this.container.setText("textInfo",
                "Tier: " + DataModel.tierName[tier] +
                "\nIterations: " + slotChip.data +
                "\nPristine chance: " + (DataModel.chance[tier] * 100) + "%"
            );
            this.animateText("textSimulation", "> Launching runtime v1.4.7    \n> Iteration #" + (slotChip.data + 1) + " started    \n> Loading model from chip memory    \n> Assessing threat level    \n> Engaged enemy    \n> Pristine procurement " + (this.data.pristine ? "succeeded" : "failed") + "    \n> Processing results    \n...");
            this.container.setText("textProgress", (this.data.progress / 3 | 0) + "%");
            if(!chip || tier === 0 || this.data.energy < chip.cost){
                this.data.progress = -1;
            }
            else{
                this.data.progress++;
                this.data.energy -= chip.cost;
                if(this.data.progress >= 300){
                    slotResult.id = result;
                    slotResult.count++;
                    if(this.data.pristine){
                        slotPristine.id = chip.pristine;
                        slotPristine.count++;
                    }
                    slotChip.data++;
                    this.data.progress = -1;
                }
            }
        }
        
        this.container.setScale("scaleData", tier === 4 ? 1 : DataModel.getCollectedData(slotChip.data) / DataModel.needData[tier]);
        this.container.setScale("scaleEnergy", this.data.energy / this.getEnergyStorage());
        
        StorageInterface.checkHoppers(this);
        
    },
    
    getEnergyStorage: function(){
        return 2e6;
    }

});


StorageInterface.createInterface(BlockID.simulation_chamber, {
    slots: {
        slotSource: {input: true},
        slotResult: {output: true},
        slotLoot: {output: true}
    },
    isValidInput: function(item){
        return item.id === ItemID.polymer_clay;
    }
});


DML.createBlock("extraction_chamber", "Loot Fabricator", [
    ["dml_machine", 0],
    ["dml_machine", 0],
    ["extraction_chamber", 0],
    ["extraction_chamber", 1],
    ["extraction_chamber", 0],
    ["extraction_chamber", 0]
]);

Recipes2.addShaped(BlockID.extraction_chamber, "_a_:bcb:ded", {
    a: VanillaItemID.gold_ingot,
    b: VanillaItemID.diamond,
    c: BlockID.charred_machine,
    d: {id: VanillaItemID.dye, data: 11},
    e: VanillaItemID.comparator
});


DML.registerInsideModel(BlockID.extraction_chamber, [
    {uv: {x: 0, y: 0}, coords: {x: -8, y: 0, z: -8}, size: {x: 16, y: 16, z: 16}},
    {uv: {x: 0, y: 32}, coords: {x: -6, y: 2, z: -9}, size: {x: 4, y: 1, z: 1}},
    {uv: {x: 0, y: 32}, coords: {x: 2, y: 2, z: -9}, size: {x: 4, y: 1, z: 1}},
    {uv: {x: 0, y: 32}, coords: {x: -6, y: 13, z: -9}, size: {x: 4, y: 1, z: 1}},
    {uv: {x: 0, y: 32}, coords: {x: 2, y: 13, z: -9}, size: {x: 4, y: 1, z: 1}},
    {uv: {x: 0, y: 32}, coords: {x: -6, y: 3, z: -9}, size: {x: 1, y: 3, z: 1}},
    {uv: {x: 0, y: 32}, coords: {x: 5, y: 3, z: -9}, size: {x: 1, y: 3, z: 1}},
    {uv: {x: 0, y: 32}, coords: {x: -6, y: 10, z: -9}, size: {x: 1, y: 3, z: 1}},
    {uv: {x: 0, y: 32}, coords: {x: 5, y: 10, z: -9}, size: {x: 1, y: 3, z: 1}},
    {uv: {x: 32, y: 32}, coords: {x: -9, y: 3, z: 2}, size: {x: 1, y: 1, z: 3}},
    {uv: {x: 32, y: 48}, coords: {x: -9, y: 3, z: -5}, size: {x: 1, y: 1, z: 4}},
    {uv: {x: 43, y: 32}, coords: {x: 8, y: 3, z: -5}, size: {x: 1, y: 1, z: 3}},
    {uv: {x: 43, y: 48}, coords: {x: 8, y: 3, z: 1}, size: {x: 1, y: 1, z: 4}},
    {uv: {x: 54, y: 32}, coords: {x: 2, y: 3, z: 8}, size: {x: 3, y: 1, z: 1}},
    {uv: {x: 54, y: 48}, coords: {x: -5, y: 3, z: 8}, size: {x: 4, y: 1, z: 1}}
]);


const selectRecipeFunc = function(container, tile, elem){
    container.setSlot("slotSample", elem.source.id, 0, elem.source.data);
};

const windowExtraction = new UI.StandartWindow({
    standart: {
        header: {text: {text: "Loot Fabricator"}},
        inventory: {standart: true},
        background: {standart: true}
    },
    params: {slot: "dml.slot_dark"},
    drawing: [
        {type: "frame", x: 400, y: 40, width: 528, height: 249, bitmap: "dml.frame_blue", color: Color.rgb(17, 17, 17), scale: 3},//176,83
        {type: "frame", x: 415, y: 67, width: 27, height: 165, bitmap: "dml.frame_dark", color: Color.BLACK, scale: 3},//5,9, 9,55
        {type: "frame", x: 439, y: 55, width: 186, height: 186, bitmap: "dml.frame_dark", color: Color.rgb(48, 48, 48), scale: 3}//13,5, 62,62
    ],
    elements: {
        scaleEnergy: {type: "scale", x: 418, y: 70, width: 21, height: 159, direction: 1, bitmap: "dml.scale_energy"},
        scaleProgress: {type: "scale", x: 655, y: 109, z: 1, width: 18, height: 105, direction: 1, bitmap: "dml.scale_progress"},
        frameProgress: {type: "frame", x: 652, y: 106, width: 24, height: 111, bitmap: "dml.frame_dark", color: Color.BLACK, scale: 3, clicker: {
            onClick: function(first, second){
                const container = getDMLContainerFromClick(first, second);
                RV && RV.openRecipePage("extraction_chamber", container);
            }
        }},//83,22, 8,37
        slotSelect0: {type: "slot", x: 442, y: 58, bitmap: "_default_slot_empty", visual: true, needClean: true, source: {id: 0, count: 0, data: 0}, clicker: {onClick: selectRecipeFunc}},
        slotSelect1: {type: "slot", x: 502, y: 58, bitmap: "_default_slot_empty", visual: true, needClean: true, source: {id: 0, count: 0, data: 0}, clicker: {onClick: selectRecipeFunc}},
        slotSelect2: {type: "slot", x: 562, y: 58, bitmap: "_default_slot_empty", visual: true, needClean: true, source: {id: 0, count: 0, data: 0}, clicker: {onClick: selectRecipeFunc}},
        slotSelect3: {type: "slot", x: 442, y: 118, bitmap: "_default_slot_empty", visual: true, needClean: true, source: {id: 0, count: 0, data: 0}, clicker: {onClick: selectRecipeFunc}},
        slotSelect4: {type: "slot", x: 502, y: 118, bitmap: "_default_slot_empty", visual: true, needClean: true, source: {id: 0, count: 0, data: 0}, clicker: {onClick: selectRecipeFunc}},
        slotSelect5: {type: "slot", x: 562, y: 118, bitmap: "_default_slot_empty", visual: true, needClean: true, source: {id: 0, count: 0, data: 0}, clicker: {onClick: selectRecipeFunc}},
        slotSelect6: {type: "slot", x: 442, y: 178, bitmap: "_default_slot_empty", visual: true, needClean: true, source: {id: 0, count: 0, data: 0}, clicker: {onClick: selectRecipeFunc}},
        slotSelect7: {type: "slot", x: 502, y: 178, bitmap: "_default_slot_empty", visual: true, needClean: true, source: {id: 0, count: 0, data: 0}, clicker: {onClick: selectRecipeFunc}},
        slotSelect8: {type: "slot", x: 562, y: 178, bitmap: "_default_slot_empty", visual: true, needClean: true, source: {id: 0, count: 0, data: 0}, clicker: {onClick: selectRecipeFunc}},
        slotSample: {type: "slot", x: 634, y: 45, bitmap: "_default_slot_empty", visual: true, needClean: true, isDarkenAtZero: false, clicker: {
            onClick: function(first, second){
                const container = getDMLContainerFromClick(first, second);
                container && container.clearSlot("slotSample");
            }
        }},
        slotSource: {type: "slot", x: 637, y: 226, size: 54, isValid: function(id){return id in extractionRecipe;}},//79,62
        slotResult0: {type: "slot", x: 710, y: 55, size: 50, isValid: validResult},
        slotResult1: {type: "slot", x: 760, y: 55, size: 50, isValid: validResult},
        slotResult2: {type: "slot", x: 810, y: 55, size: 50, isValid: validResult},
        slotResult3: {type: "slot", x: 860, y: 55, size: 50, isValid: validResult},
        slotResult4: {type: "slot", x: 710, y: 105, size: 50, isValid: validResult},
        slotResult5: {type: "slot", x: 760, y: 105, size: 50, isValid: validResult},
        slotResult6: {type: "slot", x: 810, y: 105, size: 50, isValid: validResult},
        slotResult7: {type: "slot", x: 860, y: 105, size: 50, isValid: validResult},
        slotResult8: {type: "slot", x: 710, y: 155, size: 50, isValid: validResult},
        slotResult9: {type: "slot", x: 760, y: 155, size: 50, isValid: validResult},
        slotResult10: {type: "slot", x: 810, y: 155, size: 50, isValid: validResult},
        slotResult11: {type: "slot", x: 860, y: 155, size: 50, isValid: validResult},
        slotResult12: {type: "slot", x: 710, y: 205, size: 50, isValid: validResult},
        slotResult13: {type: "slot", x: 760, y: 205, size: 50, isValid: validResult},
        slotResult14: {type: "slot", x: 810, y: 205, size: 50, isValid: validResult},
        slotResult15: {type: "slot", x: 860, y: 205, size: 50, isValid: validResult}
    }
});

const elementsExtraction = windowExtraction.getWindow("main").getElements();


DML.registerMachine("extraction_chamber", { 
    
    defaultValues: {
        meta: 0,
        energy: 0,
        progress: 0
    },
    
    getGuiScreen: function(){
        return windowExtraction;
    },
    
    hasSpace: function(item){
        const stack = Item.getMaxStack(item.id, item.data);
        let slot;
        let space = 0;
        for(let i = 0; i < 16; i++){
            slot = this.container.getSlot("slotResult" + i);
            if(slot.id === 0 || slot.id === item.id && slot.data === item.data){
                space += stack - slot.count;
            }
        }
        return item.count <= space;
    },
    
    tick: function(){
        
        const slotSource = this.container.getSlot("slotSource");
        const slotSample = this.container.getSlot("slotSample");
        const recipe = extractionRecipe[slotSource.id] || [];
        
        if(this.container.isOpened()){
            for(let i = 0; i < 9; i++){
                elementsExtraction.get("slotSelect" + i).onBindingUpdated("source", recipe[i] || {id: 0, count: 0, data: 0});
            }
        }
        
        if(slotSample.id !== 0){
            const result = recipe.find(function(item){
                return item.id === slotSample.id && item.data === slotSample.data;
            });
            if(result){
                if(this.data.progress < 50 && this.data.energy >= (this.data.progress > 0 ? 256 : 256 * 50)){
                    this.data.energy -= 256;
                    this.data.progress++;
                }
                if(this.data.progress >= 50){
                    // chance хранится как доля: 0.1 = 10%, 0.9 = 90%.
                    const dropped = Math.random() < (result.chance === undefined ? 1 : result.chance);
                    if(!dropped || this.hasSpace(result)){
                        if(dropped){
                        const stack = Item.getMaxStack(result.id, result.data);
                        let count = result.count;
                        let slot;
                        let add = 0;
                        for(let i = 0; i < 16; i++){
                            slot = this.container.getSlot("slotResult" + i);
                            if(slot.id === 0 || slot.id === result.id && slot.data === result.data){
                                add = Math.min(count, stack - slot.count);
                                slot.id = result.id;
                                slot.data = result.data;
                                slot.count += add;
                                count -= add;
                            }
                            if(count === 0){
                                break;
                            }
                        }
                        }
                        slotSource.count--;
                        this.container.validateSlot("slotSource");
                        this.data.progress = 0;
                    }
                }
            }
            else{
                this.data.progress = 0;
            }
        }
        else{
            this.data.progress = 0;
        }
        
        this.container.setScale("scaleEnergy", this.data.energy / this.getEnergyStorage());
        this.container.setScale("scaleProgress", this.data.progress / 50);
        
        StorageInterface.checkHoppers(this);
        
    },
    
    getEnergyStorage: function(){
        return 1e6;
    }

});


StorageInterface.createInterface(BlockID.extraction_chamber, {
    slots: {
        slotSource: {input: true},
        slotResult0: {output: true},
        slotResult1: {output: true},
        slotResult2: {output: true},
        slotResult3: {output: true},
        slotResult4: {output: true},
        slotResult5: {output: true},
        slotResult6: {output: true},
        slotResult7: {output: true},
        slotResult8: {output: true},
        slotResult9: {output: true},
        slotResult10: {output: true},
        slotResult11: {output: true},
        slotResult12: {output: true},
        slotResult13: {output: true},
        slotResult14: {output: true},
        slotResult15: {output: true}
    },
    isValidInput: function(item){
        return item.id in extractionRecipe;
    }
});


let linkerCoords = null;
createItem("altar_linker", "Altar Linker", 1);

Item.registerUseFunction("altar_linker", function(coords, item, block){
    if(Entity.getSneaking(player)){
        switch(block.id){
            case BlockID.digital_agonizer:
                linkerCoords = {x: coords.x, y: coords.y, z: coords.z};
                Game.tipMessage("Set Agonizer target!");
            break;
            case BlockID.bloodAltar:
                if(linkerCoords){
                    const tile = World.getTileEntity(linkerCoords.x, linkerCoords.y, linkerCoords.z);
                    if(!tile || tile.blockID !== BlockID.digital_agonizer){
                        Game.tipMessage("Agonizer not found!");
                        break;
                    }
                    if(Entity.getDistanceBetweenCoords(coords, linkerCoords) > 25){
                        Game.tipMessage("Altar too far away from agonizer!");
                        break;
                    }
                    tile.data.altarX = coords.x - linkerCoords.x;
                    tile.data.altarY = coords.y - linkerCoords.y;
                    tile.data.altarZ = coords.z - linkerCoords.z;
                    Game.tipMessage("Linked Altar to target Agonizer!");
                }
            break;
            default:
                if(linkerCoords){
                    linkerCoords = null;
                    Game.tipMessage("Cleared Target!");
                }
        }
    }
    else{
        Game.tipMessage("Sneak");
    }
});


DML.createBlock("digital_agonizer", "Digital Mob Agonizer", [
    ["dml_machine", 0],
    ["dml_machine", 0],
    ["digital_agonizer", 0],
    ["digital_agonizer", 1],
    ["digital_agonizer", 0],
    ["digital_agonizer", 0]
]);

DML.registerInsideModel(BlockID.digital_agonizer, [
    {uv: {x: 0, y: 0}, coords: {x: -8, y: 0, z: -8}, size: {x: 16, y: 16, z: 16}},
    {uv: {x: 32, y: 32}, coords: {x: -9, y: 3, z: 2}, size: {x: 1, y: 1, z: 3}},
    {uv: {x: 32, y: 48}, coords: {x: -9, y: 3, z: -5}, size: {x: 1, y: 1, z: 4}},
    {uv: {x: 43, y: 32}, coords: {x: 8, y: 3, z: -5}, size: {x: 1, y: 1, z: 3}},
    {uv: {x: 43, y: 48}, coords: {x: 8, y: 3, z: 1}, size: {x: 1, y: 1, z: 4}},
    {uv: {x: 54, y: 32}, coords: {x: 2, y: 3, z: 8}, size: {x: 3, y: 1, z: 1}},
    {uv: {x: 54, y: 48}, coords: {x: -5, y: 3, z: 8}, size: {x: 4, y: 1, z: 1}}
]);

Callback.addCallback("PreLoaded", function(){
    try{
        Recipes2.addShaped(ItemID.altar_linker, "abc:ddd", {
            a: {id: VanillaItemID.dye, data: 1},
            b: VanillaItemID.ender_pearl,
            c: ItemID.divinationSigil,
            d: ItemID.charred_plate
        });
        Recipes2.addShaped(BlockID.digital_agonizer, "_a_:bcb:ded", {
            a: ItemID.demonicSlate,
            b: ItemID.elementalScribeToolDusk,
            c: BlockID.charred_machine,
            d: BlockID.sacrificeRune,
            e: VanillaItemID.comparator
        });
    }
    catch(e){
        //alert(e);
    }
});


const windowAgonizer = new UI.StandartWindow({
    standart: {
        header: {text: {text: "Digital Mob Agonizer"}},
        inventory: {standart: true},
        background: {standart: true}
    },
    drawing: [
        {type: "frame", x: 400, y: 40, width: 428, height: 236, bitmap: "dml.frame_blue", bg: Color.rgb(17, 17, 17), scale: 4},//107,59
        {type: "frame", x: 420, y: 56, width: 36, height: 204, bitmap: "dml.frame_dark", bg: Color.BLACK, scale: 4},//5,4, 9,51
        {type: "line", x1: 568, y1: 158, x2: 708, y2: 158, width: 24, color: Color.rgb(33, 33, 33)},
        {type: "line", x1: 480, y1: 124, x2: 540, y2: 124, width: 8, color: Color.rgb(66, 66, 66)},
    ],
    elements: {
        scaleEnergy: {type: "scale", x: 424, y: 60, width: 28, height: 196, direction: 1, bitmap: "dml.scale_energy"},
        scaleProgress: {type: "scale", x: 568, y: 146, width: 140, height: 24, bitmap: "dml.scale_progress"},
        scaleCatalyst: {type: "scale", x: 480, y: 120, width: 60, height: 8, bitmap: "dml.scale_catalyst"},
        slotCatalyst: {type: "slot", x: 480, y: 128, bitmap: "dml.slot_dark", size: 60},
        slotChip: {type: "slot", x: 584, y: 300, bitmap: "dml.slot_chip", size: 60},
        slotAltar: {type: "slot", x: 732, y: 118, bitmap: "_default_slot_empty", size: 80, visual: true, source: {id: BlockID.bloodAltar, count: 1, data: 0}},
        textInfo: {type: "text", x: 638, y: 96, multiline: true, font: {size: 30, color: Color.WHITE, shadow: 0.5, alignment: 1}}
    }
});


const bloodAmount = [0, 50, 75, 150, 300];


DML.registerMachine("digital_agonizer", {
    
    defaultValues: {
        meta: 0,
        energy: 0,
        progress: 0,
        catalyst: 0,
        catalystOpe: 0,
        altarX: 0,
        altarY: 0,
        altarZ: 0
    },

    getGuiScreen: function(){
        if(this.data.altarX === 0 && this.data.altarY === 0 && this.data.altarZ === 0){
            Game.tipMessage("No linked Altar");
            return null;
        }
        return windowAgonizer;
    },

    getAltar: function(){
        if(this.data.altarX !== 0 || this.data.altarY !== 0 || this.data.altarZ !== 0){
            const altar = World.getTileEntity(this.x + this.data.altarX, this.y + this.data.altarY, this.z + this.data.altarZ);
            if(altar && altar.blockID === BlockID.bloodAltar){
                return altar;
            }
            this.data.altarX = this.data.altarY = this.data.altarZ = 0;
        }
        return null;
    },
    
    tick: function(){

        if(this.data.catalyst === 0){
            const slotCatalyst = this.container.getSlot("slotCatalyst");
            const operations = MatterParams.getOperations(slotCatalyst.id);
            if(operations > 0){
                this.data.catalyst = slotCatalyst.id;
                this.data.catalystOpe = operations;
                slotCatalyst.count--;
                this.container.validateSlot("slotCatalyst");
            }
        }

        const slotChip = this.container.getSlot("slotChip");
        const tier = DataModel.getTier(slotChip.data);
        let flag = false;

        if(DataModel.isDataModel(slotChip.id) && tier > 0){
            if(this.data.energy >= 128){
                this.data.progress++;
                this.data.energy -= 128;
                if(this.data.progress >= 60){
                    const altar = this.getAltar();
                    if(altar){
                        const multiplier = (((altar.data.sacrifice + MatterParams.getMultiplier(this.data.catalyst)) * 10) | 0) / 10;
                        const amount = bloodAmount[tier] * multiplier | 0;
                        this.container.setText("textInfo", multiplier + "x\n\n" + amount + "mB");
                        if(altar.data.blood + amount <= altar.getBloodStorage()){
                            altar.data.blood += amount;
                            this.data.progress = 0;
                            this.data.catalystOpe--;
                            if(this.data.catalystOpe <= 0){
                                this.data.catalyst = this.data.catalystOpe = 0;
                            }
                        }
                    }
                }
            }
        }
        else{
            this.data.progress = 0;
        }

        this.container.setScale("scaleEnergy", this.data.energy / this.getEnergyStorage());
        this.container.setScale("scaleProgress", this.data.progress / 60);
        this.container.setScale("scaleCatalyst", this.data.catalystOpe / MatterParams.getOperations(this.data.catalyst));

        StorageInterface.checkHoppers(this);

    },
    
    getEnergyStorage: function(){
        return 1e5;
    }

});


StorageInterface.createInterface(BlockID.digital_agonizer, {
    slots: {
        slotCatalyst: {input: true}
    },
    isValidInput: function(item){
        return MatterParams.isMatter(item.id);
    }
});

ModAPI.registerAPI("DMLCore", {
    DataModel: DataModel
});


let RV;
ModAPI.addAPICallback("RecipeViewer", function(api){

    RV = api.Core;
    
    const utilSimulation = function(id){
        const chip = DataModel.getData(id);
        return {
            input: [{id: id - 0, count: 1, data: 0}, {id: ItemID.polymer_clay, count: 1, data: 0}],
            output: [{id: DataModel.getMatter(chip.type), count: 1, data: 0}, {id: chip.pristine, count: 1, data: 0}]
        };
    };
    
    RV.registerRecipeType("simulation_chamber", {
        title: "Simulation Chamber",
        contents: {
            icon: BlockID.simulation_chamber,
            params: {slot: "dml.slot_dark"},
            drawing: [
                {type: "frame", x: 180, y: 100, width: 640, height: 160, bitmap: "dml.frame_blue", bg: Color.rgb(17, 17, 17), scale: 6},
                {type: "frame", x: 386, y: 156, width: 228, height: 48, bitmap: "dml.frame_dark", bg: Color.BLACK, scale: 6},
                {type: "bitmap", x: 392, y: 162, width: 216, height: 36, bitmap: "dml.scale_progress"}
            ],
            elements: {
                input0: {type: "slot", x: 50, y: 120, bitmap: "dml.slot_i", size: 120},
                input1: {type: "slot", x: 230, y: 120, size: 120},
                output0: {type: "slot", x: 654, y: 120, size: 120},
                output1: {type: "slot", x: 510, y: 270, size: 120}
            }
        },
        getList: function(id, data, isUsage){
            const list = [];
            let key = "";
            if(isUsage){
                if(DataModel.isDataModel(id)){
                    return [utilSimulation(id)];
                }
                if(id === ItemID.polymer_clay){
                    for(key in DataModel.data){
                        list.push(utilSimulation(key));
                    }
                    return list;
                }
                return list;
            }
            if(MatterParams.isMatter(id)){
                for(key in DataModel.data){
                    if(DataModel.getMatter(DataModel.data[key].type) === id){
                        list.push(utilSimulation(key));
                    }
                }
                return list;
            }
            if(id in extractionRecipe){
                for(key in DataModel.data){
                    if(DataModel.data[key].pristine === id){
                        return [utilSimulation(key)];
                    }
                }
            }
            return list;
        },
        getAllList: function(){
            const list = [];
            for(let key in DataModel.data){
                list.push(utilSimulation(key));
            }
            return list;
        }
    });
    
    
    RV.registerRecipeType("extraction_chamber", {
        title: "Loot Fabricator",
        contents: {
            icon: BlockID.extraction_chamber,
            drawing: [
                {type: "frame", x: 180, y: 100, width: 640, height: 160, bitmap: "dml.frame_blue", bg: Color.rgb(17, 17, 17), scale: 6},
                {type: "frame", x: 386, y: 156, width: 228, height: 48, bitmap: "dml.frame_dark", bg: Color.BLACK, scale: 6},
                {type: "bitmap", x: 392, y: 162, width: 216, height: 36, bitmap: "dml.scale_progress", scale: 6}
            ],
            elements: {
                input0: {type: "slot", x: 230, y: 120, bitmap: "dml.slot_dark", size: 120},
                output0: {type: "slot", x: 654, y: 120, bitmap: "dml.slot_dark", size: 120}
            }
        },
        getList: function(id, data, isUsage){
            const list = [];
            let i = 0;
            if(isUsage){
                if(id in extractionRecipe){
                    for(i = 0; i < extractionRecipe[id].length; i++){
                        list.push({
                            input: [{id: id, count: 1, data: 0}],
                            output: [extractionRecipe[id][i]]
                        });
                    }
                    return list;
                }
            }
            for(let key in extractionRecipe){
            for(i = 0; i < extractionRecipe[key].length; i++){
                if(extractionRecipe[key][i].id === id && (extractionRecipe[key][i].data || 0) === (data === -1 ? 0 : data)){
                    list.push({
                        input: [{id: key - 0, count: 1, data: 0}],
                        output: [extractionRecipe[key][i]]
                    });
                }
            }
            }
            return list;
        },
        getAllList: function(){
            const list = [];
            let i = 0;
            for(let key in extractionRecipe){
            for(i = 0; i < extractionRecipe[key].length; i++){
                list.push({
                    input: [{id: key - 0, count: 1, data: 0}],
                    output: [extractionRecipe[key][i]]
                });
            }
            }
            return list;
        }
    });
    
});

// Закрываем окна мода при выходе из мира, иначе GUI зависает поверх главного меню
Callback.addCallback("LevelLeft", function(){
    [Learner.window, Learner.popupWindow, windowSimulation, windowExtraction, windowAgonizer].forEach(function(win){
        try{
            win && win.close();
        }
        catch(e){}
    });
    Learner.page = 0;
});

