# 2.0.2 (fix)
- header.js: ClassCastException "Undefined cannot be cast to Number" при установке машин (IC2 TileRender v21 меняет сигнатуру `getBlockRotation(player, hasVertical)`). Place-функция 3D-режима переписана: берёт `player` и `region`, поворот = `getBlockRotation(player, false) - 2`.
- header.js: `canTileBeReplaced` получается безопасно, с запасным вариантом `World.canTileBeReplaced`.
- footer.js: при выходе из мира (`LevelLeft`) закрываются все окна мода, чтобы Deep Learner не зависал поверх главного меню.

# 2.0.1 (fix)
- extraction.js: `isPristine` -> проверка по `extractionRecipe`; исправлены `hasSpace` и списание энергии.
- learner.js: убраны утечки глобальных переменных, опечатка `paddind`.
- footer.js: исправлены данные и имена битмапов в RecipeViewer.
Исправления найдены статическим анализом, в игре не запускались.
## Custom loot update

- Skeleton, Creeper and Wither Skeleton heads now drop from the corresponding Matter loot with a guaranteed count of 1.
- Wither Nether Star and Ender Dragon Egg now drop from Matter loot with a guaranteed count of 1.
- Removed the old 10% chance fields from these special loot entries.
