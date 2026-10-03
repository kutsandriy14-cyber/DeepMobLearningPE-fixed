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
