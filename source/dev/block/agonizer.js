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