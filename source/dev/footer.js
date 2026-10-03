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
