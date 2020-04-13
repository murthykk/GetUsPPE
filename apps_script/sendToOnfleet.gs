// Prerequisites:
// - The 'All Responses' sheet needs to have the following columns:
//     Name, Phone number, Street Name, Apartment/Unit, City, Zip, Availability, Pick up instructions, Timestamp, Onfleet Task ID'
// - The 'Configuration' sheet should have keys in column A and values in column B. The following keys should exist:
//     Team, State / Province

// Creates a menu item to send Reasy to Assign tasks to OnFleet.
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('OnFleet')
      .addItem('Send Ready to Assign to OnFleet', 'sendToOnfleet')
      .addToUi();
}

async function sendToOnfleet() {
  let spreadsheet = SpreadsheetApp.getActive();
  let sourceSheet = spreadsheet.getSheetByName("All Responses");
  let headings = sourceSheet.getDataRange().offset(0, 0, 1).getValues()[0];
  let statusIndex = headings.indexOf('ADMIN: Status');
  
  let getReadyToAssign = sourceSheet.getDataRange().getValues().filter(function (r) {
     return r[statusIndex] === 'Ready to Assign'
  });
  
  let recipientNameIndex = headings.indexOf('Name');
  let recipientPhoneIndex = headings.indexOf('Phone number');
  let addressIndex = headings.indexOf('Street Name')
  let address2Index = headings.indexOf('Apartment/Unit');
  let cityIndex = headings.indexOf('City');
  let zipIndex = headings.indexOf('Zip');
  let notesAvailabilityIndex = headings.indexOf('Availability');
  let notesPickupIndex = headings.indexOf('Is there anything else we should know? (special pick up instructions)')
  let timestampIndex = headings.indexOf('Timestamp');
  let onfleetTaskIdIndex = headings.indexOf('OnFleet Task ID');
  
  let config = getConfiguration();
  let teamName = config["Team"];
  let teamId = await getTeamIdFromOnfleet(teamName);
  let stateOrProvince = config["State / province"];
  
  Logger.log('Sending ' + getReadyToAssign.length + ' tasks to OnFleet team ' + teamName + '.')
  let failedToSendNames = [];
  for (var i = 0; i < getReadyToAssign.length; i++) {
    let task = getReadyToAssign[i]
    let recipientName = task[Object.keys(task)[recipientNameIndex]];
    // (murthykk) Does the state (e.g. California) need to be in the address?
    let address = task[Object.keys(task)[addressIndex]] + ', ' + task[Object.keys(task)[address2Index]] + ', ' + task[Object.keys(task)[cityIndex]] + ', ' + stateOrProvince + ', ' + task[Object.keys(task)[zipIndex]];
    let recipientPhone = String(task[Object.keys(task)[recipientPhoneIndex]]);
    let notesAvailability = task[Object.keys(task)[notesAvailabilityIndex]];
    let notesPickup = task[Object.keys(task)[notesPickupIndex]]
    let timestamp = task[Object.keys(task)[timestampIndex]]

    let response = await sendTaskToOnfleet(teamId, address, recipientName, recipientPhone, notesAvailability, notesPickup);
    let onfleetStatusCode = await response.getResponseCode();
    if (onfleetStatusCode === 200) {
      let parseResponse = await JSON.parse(response.getContentText());
      // (murthykk) does the row need to be searched for again, or does getReadyToAssign[i] represent the row? 
      let findRow = await findRowByValue(timestamp);
      // Update spreadsheet status and task ID from Onfleet
      sourceSheet.getRange(findRow, statusIndex + 1, 1, 1).setValue('Sent to OnFleet');
      let taskId = parseResponse.shortId;
      // Write the task ID into the cell, and also hyperlink to the task in OnFleet.
      sourceSheet
          .getRange(findRow, onfleetTaskIdIndex + 1, 1, 1)
          .setValue('=HYPERLINK("https://onfleet.com/dashboard#/table?open=task&taskId=' + taskId + '", "' + taskId + '")');
    } else {
      failedToSendNames.push(recipientName);
      Logger.log(response, 'ERROR creating task for ' + recipientName);
    }
  }
  
  // Final dialog box with results.
  if (getReadyToAssign.length > 0) {
    var ui = SpreadsheetApp.getUi();
    let successStr = 
        failedToSendNames.length < getReadyToAssign.length
        ? 'Successfully sent ' + getReadyToAssign.length + ' "Ready to Assign" tasks to OnFleet.\n' +
          'Their status has been changed to "Sent to OnFleet".'
        : null;
    let failStr =
        failedToSendNames.length > 0
        ? 'Failed to send ' + failedToSendNames.length + ' "Ready to Assign" tasks to OnFleet. Names: ' + JSON.stringify(failedToSendNames)
        : null;
    ui.alert([successStr, failStr].filter(Boolean).join('\n\n'));
  }
}
