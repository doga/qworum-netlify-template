
// The Qworum library.
// Documentation: https://qworum.net/docs/qworum-for-web-pages/latest/
import { Qworum } from "https://esm.sh/gh/doga/qworum-for-web-pages@1.2.0/mod.mjs";

const
  // Qworum Data value types
  Json = Qworum.Json,
  SemanticData = Qworum.SemanticData,
  // Qworum instructions
  Data = Qworum.Data,
  Return = Qworum.Return,
  Sequence = Qworum.Sequence,
  Goto = Qworum.Goto,
  Call = Qworum.Call,
  Fault = Qworum.Fault,
  Try = Qworum.Try,
  // Qworum script
  Script = Qworum.Script;

console.debug(`[view-item] Qworum.version: ${Qworum.version}`);

// Items to show
import { items } from "./modules/items.mjs";

// console.debug(`[view-item] items: ${Qworum.version}`);


await showItem();

async function showItem() {
  console.debug(`showing item `);
  const
    // call argument
    itemIdArg = await Qworum.getData('item id'),
    itemId = itemIdArg.value,                   // int
    item = items[itemId],

    // UI
    closeButton = document.getElementById('close'),
    title = document.getElementById('item-title'),
    details = document.getElementById('item-details');

  console.debug(`item id: ${itemId} `);


  title.innerText = item.title;
  details.innerText = item.details;

  // closeButton.onclick(async (event) => {
  //   console.debug('close button clicked');
  //   event.preventDefault();
  //   await Qworum.eval(
  //     Script(
  //       Return(Json(itemId))
  //     )
  //   );
  // });

  closeButton.addEventListener('click', (event) => {
    // console.debug('close button clicked');
    // event.preventDefault();
    Qworum.eval(
      Script(
        Return(Json(itemId))
      )
    );
  });

}
