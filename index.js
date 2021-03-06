'use strict';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
// Imports dependencies and set up http server
const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    body.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);


      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender ID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        if (webhook_event.message.quick_reply) {
          handlePostback (sender_psid, webhook_event.message.quick_reply);
        }
        else {
        handleMessage(sender_psid, webhook_event.message);  
        }
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }

      
    });
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "ihopethisworks";
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

function handleMessage(sender_psid, received_message) {
  let response;
  
  // Checks if the message contains text
  if (received_message.text) {    
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    response = {
      "text": `You sent the message: "${received_message.text}". Now send me an attachment!`
    }
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
  } 
  
  // Send the response message
  callSendAPI(sender_psid, response);    
}

function handlePostback(sender_psid, received_postback) {
  console.log('ok')
   let response;
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === '<postback_payload>') {
    response = ifEmergency('Is this an emergency?')
    //callSendAPI(sender_psid, response);
  } 
  else if (payload === 'isnotemergency') {
    response = askHelp('How can I help?')
  }
  else if (payload === 'isemergency') {
    response = call911('Would you like to call 911?')
  }
  else if (payload === 'medicalhelp') {
    //esponse = localcenters('what is wrong?')
    response = localcenters('Medical help for sexual assault can be found at all health centers. However, not all hospitals have trained staff members to help perform a rape kit. To ensure you get the best care possible, you can get in touch with RAINN to help locate a health center near you with the resources you need. They can help guide you through the process of receiving medical care and rape kit as well as provide a trained advocate to accompany you to the hospital. Although the sexual assault forensic exam is not mandatory, it is recommended to collect evidence in the case that you do decide to report in the future.')
  }
  else if (payload === 'report') {
    response = reportingoptions('Are you currently enrolled in school/university?')
  }
  else if (payload === 'inschool') {
      response = nonschoolreportingresources('Often schools and universities have counselors and staff trained to help sexual assault victims. If you are currently enrolled in a university, your campus most likely has a Title IX office who can help you with filing a report both through the university and officially with the police. \n  However, if there is for any reason you choose not to report through your school, there are also many nonaffiliated resources available as well. \n Please keep in mind that you are not limited to reporting just to your school; you can report both to your school staff as well as the police. \n Would you like to find outside resources?')
  }
  else if (payload === 'nonschoolresources') {
    //response = reportingresources('???')
    response = reportingresources('There are many resources available. Remember you are not alone. \n RAINN is a confidential anti-sexual violence organization with a 24/7 hotline and many available resources who can support you either with finding medical services and reporting sexual assault. \n NSVRC is a national network of community-based crisis centers and local organizations that support assault survivors through advocacy, accompaniment, follow-up services, as well as referrals to other resources. \n YWCA is network of domestic and sexual violence service providers for women offering safe housing, crisis hotlines, counseling, and court assistance to women.')
  }
  else if (payload === 'notinschool') {
    response = reportingresources('There are many resources available. Remember you are not alone. \n RAINN is a confidential anti-sexual violence organization with a 24/7 hotline and many available resources who can support you either with finding medical services and reporting sexual assault. \n NSVRC is a national network of community-based crisis centers and local organizations that support assault survivors through advocacy, accompaniment, follow-up services, as well as referrals to other resources. \n YWCA is network of domestic and sexual violence service providers for women offering safe housing, crisis hotlines, counseling, and court assistance to women.')
  }
  else if (payload === 'notsure') {
    response = notSure('It is common after sexual assault to be confused about how to react. Sexual consent consists of underage sex or absence of voluntary consent for the entirety of the sexual encounter. The following can be used as a guide to help you find support and resources. \n Are you under 18?')    
  }
  else if (payload === 'underage') {
    response = reportingoptions('There is mandated reporting of the assault for those under 18. \n Are you currently enrolled in school/university?')
  }
  else if (payload === 'adult') {
    response = adult('Is it recent?')
  }
  else if (payload === 'recent') {
    response = recent('Getting medical attention after assault is crucial, even if you do not have any visible injuries. \n Please refrain from washing and get a medical rape kit. Even if you do not wish to report now, you can still keep the rape kit.')
  }
  else if (payload === 'notrecent') {
    //response = notrecent('???')
    response = notrecent('The current statue of limitations vary from state to state, however, many efforts have been made to push the statue of limitations further or even to remove the statue of limitations for sexual crimes. Even if assault is not recent, many surviors decide to report later. Should you choose to do so, there are many resources available.')
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

const nonschoolreportingresources = (text) => {
  return {
      "text": text,
      "quick_replies": [
        {
         "content_type": "text",
         "title": "Find resources",
         "payload": "nonschoolresources" 
        }
      ]
    }
  }

const reportingresources = (text) => {
  return {
    "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                        "type":"web_url",
                        "url" : "https://centers.rainn.org/",
                        "title":"Find RAINN help centers"
                    },
                    {
                        "type":"web_url",
                        "url" : "https://www.nsvrc.org/organizations",
                        "title":"Find NSVRC organizations"
                    },
                    {
                        "type":"web_url",
                        "url" : "https://secure2.convio.net/ywca/site/SPageServer;jsessionid=00000000.app216a?pagename=YWCA_Map&NONCE_TOKEN=B2B8790BD56441665CF0F8B1745E4AA2",
                        "title":"Find YWCA centers"
                    }

                ]
            }
        }
    }
}

const reportingoptions = (text) => {
  return {
      "text": text,
      "quick_replies": [
        {
         "content_type": "text",
         "title": "Yes",
         "payload": "inschool" 
        },
        {
          "content_type": "text",
          "title": "No",
          "payload": "notinschool"
        }
      ]
    }
  }


const localcenters = (text) => {
  return {
    "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                        "type":"web_url",
                        "url" : "https://centers.rainn.org/",
                        "title":"Find RAINN help centers"
                    }
                ]
            }
        }
    }
}

const notrecent = (text) => {
  return {
    "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"Report",
                        "payload":"report"
                    }
                ]
            }
        }
    }
}

const recent = (text) => {
  return {
    "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"Seek medical center",
                        "payload":"medicalhelp"
                    }
                ]
            }
        }
    }
}

const adult = (text) => {
  return {
      "text": text,
      "quick_replies": [
        {
         "content_type": "text",
         "title": "Yes",
         "payload": "recent" 
        },
        {
          "content_type": "text",
          "title": "No",
          "payload": "notrecent"
        }
      ]
    }
  }

const underage = (text) => {
  return {
    "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"Yes",
                        "payload":"reportingoptions"
                    }

                ]
            }
        }
    }
}

const notSure = (text) => {
  return {
      "text": text,
      "quick_replies": [
        {
         "content_type": "text",
         "title": "Under 18",
         "payload": "underage" 
        },
        {
          "content_type": "text",
          "title": "Over 18",
          "payload": "adult"
        }
      ]
    }
  }


const confidvsnon = (text) => {
  return {
    "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"Confidential",
                        "payload":"confidential"
                    },
                    {
                        "type":"postback",
                        "title":"Nonconfidential",
                        "payload":"nonconfidential"
                    }

                ]
            }
        }
    }
}

const confidentialResources= (text) => {
  return {
    "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"Confidential",
                        "payload":"confidential"
                    },
                    {
                        "type":"postback",
                        "title":"Nonconfidential",
                        "payload":"nonconfidential"
                    }

                ]
            }
        }
    }
}


const nonconfidentialResources= (text) => {
  return {
    "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"Confidential",
                        "payload":"confidential"
                    },
                    {
                        "type":"postback",
                        "title":"Nonconfidential",
                        "payload":"nonconfidential"
                    }

                ]
            }
        }
    }
} 

const ifEmergency = (text) => {
  return {
    "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"Yes",
                        "payload":"isemergency"
                    },
                    {
                        "type":"postback",
                        "title":"No",
                        "payload":"isnotemergency"
                    }

                ]
            }
        }
    }
  }

const askHelp = (text) => {
  return {
    "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"Need medical help",
                        "payload":"medicalhelp"
                    },
                    {
                        "type":"postback",
                        "title":"Report to authorities",
                        "payload":"report"
                    },
                    {
                        "type":"postback",
                        "title":"I'm not sure",
                        "payload":"notsure"
                    }

                ]
            }
        }
    }
  }

const call911 = (text) => {
  return {
    "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                        "type":"phone_number",
                        "title":"Call 911",
                        "payload":"+1911"
                    }
                ]
            }
        }
    }
  }


function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}