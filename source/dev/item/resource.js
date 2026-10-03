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