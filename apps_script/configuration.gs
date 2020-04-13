function getConfiguration() {
  let spreadsheet = SpreadsheetApp.getActive();
  let sourceSheet = spreadsheet.getSheetByName("Configuration");
  let keys = sourceSheet.getRange("A1:A10").getValues().flat();
  let values = sourceSheet.getRange("B1:B10").getValues().flat();

  let config = {}
  keys.map(function(key, idx) { 
    if (key) {
      config[key] = values[idx] 
    }
  });
  
  Logger.log("getConfiguration(): " + JSON.stringify(config));
  
  return config;
}


