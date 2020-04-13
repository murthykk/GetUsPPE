function findRowByValue(value) {
  let spreadsheet = SpreadsheetApp.getActive();
  let sourceSheet = spreadsheet.getSheetByName("All Responses");
  let dataRange = sourceSheet.getDataRange();
  let values = dataRange.getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][0].toString() === value.toString()) {
      return i+1;
    }
  }
  return -1;
}
