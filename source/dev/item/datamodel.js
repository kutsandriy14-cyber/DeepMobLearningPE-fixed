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
