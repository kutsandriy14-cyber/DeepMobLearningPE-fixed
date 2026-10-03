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
