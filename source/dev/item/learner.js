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
