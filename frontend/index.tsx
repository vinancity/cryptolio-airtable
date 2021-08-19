import {
  initializeBlock,
  useBase,
  useRecordIds,
  Button,
} from "@airtable/blocks/ui";
import React from "react";
import axios from "axios";

function RecordCount({ table }) {
  const recordIds = useRecordIds(table);
  return <div>Table has {recordIds.length} record(s)</div>;
}

const updatePrice = async (
  ids: string,
  vs_currencies = "usd"
): Promise<number> => {
  try {
    const result = await axios(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currencies}`
    );
    const price = result.data[ids][vs_currencies];
    return price;
  } catch (err) {
    console.error(err);
    return -1;
  }
};

function HelloWorldTypescriptApp() {
  const base = useBase();
  const table = base.getTableByNameIfExists("StakeHolder");

  const updateKardiaPrice = async () => {
    let table = base.getTable("Asset");
    let assets = await table.selectRecordsAsync();
    let idsField = table.getField("ids");
    let priceField = table.getField("APIPrice");
    let replacements = [];
    for (let record of assets.records) {
      let ids: string = record.getCellValue(idsField) as string;
      const price = await updatePrice(ids);
      if (price !== -1) {
        replacements.push({
          record,
          after: price,
        });
      }
    }

    let updates = replacements.map((replacement) => ({
      id: replacement.record.id,
      fields: {
        [priceField.id]: replacement.after,
      },
    }));
    while (updates.length > 0) {
      await table.updateRecordsAsync(updates.slice(0, 50));
      updates = updates.slice(50);
    }
  };

  if (table) {
    return (
      <div>
        <Button onClick={updateKardiaPrice}>Update Price</Button>
      </div>
    );
  } else {
    return <div>Table is deleted! :(</div>;
  }
}

initializeBlock(() => <HelloWorldTypescriptApp />);
