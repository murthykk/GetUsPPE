// httpMethod (string): one of the HTTP method (get, post, etc.)
// payload (string): payload to send with the request.
function getOnfleetHttpOptions(httpMethod, payload = null) {
  let options = {
    "method": httpMethod,
    "headers": {
      "Authorization": "Basic " + Utilities.base64Encode("a8f8bf4de49b8f5df52b45a247a348f0:"),
      "Content-Type": "application/json"
    },
    "muteHttpExceptions": true
  }
  if (payload) {
    options["payload"] = payload;
  }
  return options
}

// Sends a single pickup task to Onfleet. Returns the HTTP response object.
// All args are strings.
async function sendTaskToOnfleet(teamId, address, recipientName, recipientPhone, notesAvailability, notesPickup) {
  let url = "https://onfleet.com/api/v2/tasks";
  let options = getOnfleetHttpOptions(
    "post",
    JSON.stringify({
      "container": {
        "type": "TEAM",
        "team": teamId,
        // Do we want to assign to a team based on region from the spreadsheet? Or set to Bay Area for now? 
        // (murthykk) Done.
      },
      "pickupTask": true,
      "destination": {
        "address": {
          "unparsed": address
        },
        "notes": notesPickup
      },
      "recipients": [
        {
          "name": recipientName,
          "phone": recipientPhone,
          "notes": 'Availability: ' + notesAvailability
        }
      ]
    }));

  let response = await UrlFetchApp.fetch(url, options);
  return response;
 
}

// Gets a team ID from Onfleet given the team name, or null on error.
async function getTeamIdFromOnfleet(teamName) {
  let url = "https://onfleet.com/api/v2/teams"
  let options = getOnfleetHttpOptions("get")
  let response = await UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() == 200) {
    let teamInfo = JSON.parse(response.getContentText());
    if (!Array.isArray(teamInfo)) {
      Logger.log("ERROR: expected an array for teamInfo. Instead, got: " + teamInfo);
    }
    for (const team of teamInfo) {
      let curTeamName = team["name"];
      if (curTeamName === teamName) {
        return team["id"];
      }
    }
  } else {
    Logger.log(response, 'ERROR')
    return null;
  }
}
