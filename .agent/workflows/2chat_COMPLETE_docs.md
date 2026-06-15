

--- SOURCE: https://developers.2chat.co/docs/API/Contacts/create-contact ---

[Skip to main content](https://developers.2chat.co/docs/API/Contacts/create-contact#__docusaurus_skipToContent_fallback)
[![2Chat Logo](https://developers.2chat.co/img/2chat-logo.png) **Developers**](https://developers.2chat.co/)[Documentation](https://developers.2chat.co/docs/intro)
[🏠 Home](https://2chat.co)[📝 Blog](https://blog.2chat.co)[GitHub](https://github.com/2ChatCo)
  * [Introduction](https://developers.2chat.co/docs/intro)
  * [API](https://developers.2chat.co/docs/category/api)
    * [🔒 Authentication](https://developers.2chat.co/docs/API/authentication)
    * [💳 Billing](https://developers.2chat.co/docs/API/billing)
    * [🔢 API Response Codes](https://developers.2chat.co/docs/API/api-response-codes)
    * [👥 Contacts](https://developers.2chat.co/docs/API/Contacts/create-contact)
      * [Create Contact](https://developers.2chat.co/docs/API/Contacts/create-contact)
      * [Delete Contact](https://developers.2chat.co/docs/API/Contacts/delete-contact)
      * [Get Contact](https://developers.2chat.co/docs/API/Contacts/get-contact)
      * [Edit Contact](https://developers.2chat.co/docs/API/Contacts/update-contact)
      * [List Contacts](https://developers.2chat.co/docs/API/Contacts/list-contacts)
      * [Search Contacts](https://developers.2chat.co/docs/API/Contacts/search-contacts)
    * [⚡ Webhooks](https://developers.2chat.co/docs/API/Contacts/create-contact)
    * [📲 WhatsApp](https://developers.2chat.co/docs/API/Contacts/create-contact)
    * [☎️ Phone Calls](https://developers.2chat.co/docs/API/Contacts/create-contact)


  * [](https://developers.2chat.co/)
  * [API](https://developers.2chat.co/docs/category/api)
  * 👥 Contacts
  * Create Contact


On this page
# Create a contact in your directory
This endpoint will let you create a contact in your [2Chat account](https://app.2chat.io/contacts) and WhatsApp account, when specified.
## Contact fields[​](https://developers.2chat.co/docs/API/Contacts/create-contact#contact-fields "Direct link to Contact fields")
Each contact must have at least a first name and some contact details like a phone number or an email address.
Field | Description  
---|---  
`first_name` | First name  
`last_name` | Last name  
`profile_pic_url` | A publicly accessible URL  
`channel_uuid` | When provided, the contact will also be created on your WhatsApp account  
`contact_details` | A list of contact details  
The `channel_uuid` parameter must a WhatsApp channel. When provided, the contact will be created on your 2Chat account and also on the WhatsApp account associated to this channel. If the contact exists on your WhatsApp account, it will be updated.
You can obtain a list of UUIDs using the [list numbers endpoint](https://developers.2chat.co/docs/API/WhatsApp/list-numbers).
## Contact details[​](https://developers.2chat.co/docs/API/Contacts/create-contact#contact-details "Direct link to Contact details")
Each person in your contact directory can have many associated details, like a phone number or a physical address. You can specify which information type you are creating by selecting the right type for each value following the instructions on the table below:
Type | Description | Example values  
---|---|---  
`E` | Email address | `myemail@example.com`  
`A` | Physical address | `Flower St. 123`  
`PH` | Phone number | `+12121112222`  
`WAPH` | Phone number that has a WhatsApp account | `+12121112222`  
When specifying a phone number, always use its international format.
### Invocation[​](https://developers.2chat.co/docs/API/Contacts/create-contact#invocation "Direct link to Invocation")
  * cURL
  * Python
  * JavaScript


```
curl --location --request POST 'https://api.p.2chat.io/open/contacts' \  
--header 'Content-Type: application/json' \  
--header 'X-User-API-Key: your_api_key_here' \  
--data '{  
    "first_name": "2Chat",  
    "last_name": "Support",  
    "channel_uuid": "WPN66037eca-9ad1-4c96-9eff-526a90a48c77",  
    "contact_detail": [  
        { "type": "PH", "value": "+17137157533" },  
        { "type": "WAPH", "value": "+17137157533" },  
        { "type": "E", "value": "support@2chat.co" }  
    ]  
}'  

```

```
import requests  
import json  
  
url = "https://api.p.2chat.io/open/contacts"  
  
payload = json.dumps(  
  {  
    "first_name": "2Chat",  
    "last_name": "Support",  
    "channel_uuid": "WPN66037eca-9ad1-4c96-9eff-526a90a48c77",  
    "contact_detail": [  
        { "type": "PH", "value": "+17137157533" },  
        { "type": "WAPH", "value": "+17137157533" },  
        { "type": "E", "value": "support@2chat.co" }  
    ]  
  }  
)  
headers = {  
  'X-User-API-Key': 'your_api_key_here',  
  'Content-Type': 'application/json'  
}  
  
response = requests.request("POST", url, headers=headers, data=payload)  
  
print(response.text)  
  

```

```
var axios = require('axios');  
var data = JSON.stringify({  
    "first_name": "2Chat",  
    "last_name": "Support",  
    "channel_uuid": "WPN66037eca-9ad1-4c96-9eff-526a90a48c77",  
    "contact_detail": [  
        { "type": "PH", "value": "+17137157533" },  
        { "type": "WAPH", "value": "+17137157533" },  
        { "type": "E", "value": "support@2chat.co" }  
    ]  
});  
  
var config = {  
  method: 'post',  
  url: 'https://api.p.2chat.io/open/contacts',  
  headers: {   
    'X-User-API-Key': 'your_api_key_here',   
    'Content-Type': 'application/json'  
  },  
  data : data  
};  
  
axios(config)  
.then(function (response) {  
  console.log(JSON.stringify(response.data));  
})  
.catch(function (error) {  
  console.log(error);  
});  

```

### Response[​](https://developers.2chat.co/docs/API/Contacts/create-contact#response "Direct link to Response")
The API will response with the new contact it created if the invocation succeeded.
```
{  
    "success": true,  
    "contact": {  
        "uuid": "CON2226e836-36dc-4103-b2a2-6307749cf390",  
        "first_name": "2Chat",  
        "last_name": "Support",  
        "channel_uuid": "WPN66037eca-9ad1-4c96-9eff-526a90a48c77",  
        "profile_pic_url": null,  
        "details": [  
            {  
                "id": 1331,  
                "value": "+17137157533",  
                "type": "PH",  
                "created_at": 1695230471,  
                "updated_at": 0  
            },  
            {  
                "id": 1332,  
                "value": "+17137157533",  
                "type": "WAPH",  
                "created_at": 1695230471,  
                "updated_at": 0  
            },  
            {  
                "id": 1333,  
                "value": "support@2chat.co",  
                "type": "E",  
                "created_at": 1695230471,  
                "updated_at": 0  
            }  
        ]  
    }  
}  

```

[Previous 🔢 API Response Codes](https://developers.2chat.co/docs/API/api-response-codes)[Next Delete Contact](https://developers.2chat.co/docs/API/Contacts/delete-contact)
  * [Contact fields](https://developers.2chat.co/docs/API/Contacts/create-contact#contact-fields)
  * [Contact details](https://developers.2chat.co/docs/API/Contacts/create-contact#contact-details)
    * [Invocation](https://developers.2chat.co/docs/API/Contacts/create-contact#invocation)
    * [Response](https://developers.2chat.co/docs/API/Contacts/create-contact#response)


Docs
  * [API & Endpoints](https://developers.2chat.co/docs/intro)
  * [Postman Collection](https://documenter.getpostman.com/view/20444184/2s946h9YKd)


Community
  * [Twitter](https://twitter.com/2Chat_)
  * [YouTube](https://www.youtube.com/@2ChatCo)
  * [LinkedIn](https://www.linkedin.com/company/2chatco/)
  * [GitHub](https://github.com/2ChatCo)


More
  * [Home](https://2chat.co)
  * [Blog](https://blog.2chat.co)
  * [Help Center](https://help.2chat.io)


Copyright © 2025 Nagence, Inc.


--- SOURCE: https://developers.2chat.co/docs/category/api ---

[Skip to main content](https://developers.2chat.co/docs/category/api#__docusaurus_skipToContent_fallback)
[![2Chat Logo](https://developers.2chat.co/img/2chat-logo.png) **Developers**](https://developers.2chat.co/)[Documentation](https://developers.2chat.co/docs/intro)
[🏠 Home](https://2chat.co)[📝 Blog](https://blog.2chat.co)[GitHub](https://github.com/2ChatCo)
  * [Introduction](https://developers.2chat.co/docs/intro)
  * [API](https://developers.2chat.co/docs/category/api)
    * [🔒 Authentication](https://developers.2chat.co/docs/API/authentication)
    * [💳 Billing](https://developers.2chat.co/docs/API/billing)
    * [🔢 API Response Codes](https://developers.2chat.co/docs/API/api-response-codes)
    * [👥 Contacts](https://developers.2chat.co/docs/category/api)
    * [⚡ Webhooks](https://developers.2chat.co/docs/category/api)
    * [📲 WhatsApp](https://developers.2chat.co/docs/category/api)
    * [☎️ Phone Calls](https://developers.2chat.co/docs/category/api)


  * [](https://developers.2chat.co/)
  * API


# API
Learn the most important concepts on how to use 2Chat's API for sending and receiving messages on WhatsApp.
## [📄️ 🔒 Authentication Learn how to authenticate to 2Chat using an API key](https://developers.2chat.co/docs/API/authentication)## [📄️ 💳 Billing Learn how API usage is billed](https://developers.2chat.co/docs/API/billing)## [📄️ 🔢 API Response Codes HTTP codes used by 2Chat's API](https://developers.2chat.co/docs/API/api-response-codes)## [🗃️ 👥 Contacts 6 items](https://developers.2chat.co/docs/API/Contacts/create-contact)## [🗃️ ⚡ Webhooks 6 items](https://developers.2chat.co/docs/API/Webhooks/supported-types)## [🗃️ 📲 WhatsApp 13 items](https://developers.2chat.co/docs/API/WhatsApp/list-numbers)## [🗃️ ☎️ Phone Calls 3 items](https://developers.2chat.co/docs/API/Phone-Calls/list-virtual-numbers)[Previous Introduction](https://developers.2chat.co/docs/intro)[Next 🔒 Authentication](https://developers.2chat.co/docs/API/authentication)
Docs
  * [API & Endpoints](https://developers.2chat.co/docs/intro)
  * [Postman Collection](https://documenter.getpostman.com/view/20444184/2s946h9YKd)


Community
  * [Twitter](https://twitter.com/2Chat_)
  * [YouTube](https://www.youtube.com/@2ChatCo)
  * [LinkedIn](https://www.linkedin.com/company/2chatco/)
  * [GitHub](https://github.com/2ChatCo)


More
  * [Home](https://2chat.co)
  * [Blog](https://blog.2chat.co)
  * [Help Center](https://help.2chat.io)


Copyright © 2025 Nagence, Inc.


--- SOURCE: https://developers.2chat.co/docs/API/api-response-codes ---

[Skip to main content](https://developers.2chat.co/docs/API/api-response-codes#__docusaurus_skipToContent_fallback)
[![2Chat Logo](https://developers.2chat.co/img/2chat-logo.png) **Developers**](https://developers.2chat.co/)[Documentation](https://developers.2chat.co/docs/intro)
[🏠 Home](https://2chat.co)[📝 Blog](https://blog.2chat.co)[GitHub](https://github.com/2ChatCo)
  * [Introduction](https://developers.2chat.co/docs/intro)
  * [API](https://developers.2chat.co/docs/category/api)
    * [🔒 Authentication](https://developers.2chat.co/docs/API/authentication)
    * [💳 Billing](https://developers.2chat.co/docs/API/billing)
    * [🔢 API Response Codes](https://developers.2chat.co/docs/API/api-response-codes)
    * [👥 Contacts](https://developers.2chat.co/docs/API/api-response-codes)
    * [⚡ Webhooks](https://developers.2chat.co/docs/API/api-response-codes)
    * [📲 WhatsApp](https://developers.2chat.co/docs/API/api-response-codes)
    * [☎️ Phone Calls](https://developers.2chat.co/docs/API/api-response-codes)


  * [](https://developers.2chat.co/)
  * [API](https://developers.2chat.co/docs/category/api)
  * 🔢 API Response Codes


On this page
# List of API response codes
2Chat uses standard HTTP response codes to contextually indicate the result of an operation. These codes try to be as contextual as possible based on the source request.
For example, an HTTP 404 reply indicates that a resource couldn't be found, but the resource being referred to could be a contact, a number, or a message, and it will always depend on the context of the request.
The API will also include a `message` field on each response that will contain a description of the error to disambiguate the response's error code further.
## HTTP response codes[​](https://developers.2chat.co/docs/API/api-response-codes#http-response-codes "Direct link to HTTP response codes")
HTTP Code | Description  
---|---  
`200` | Successfully executed retrieval operation.  
`201` | Content created, for example, during a contact creation.  
`202` | Request accepted, usually to be processed asynchronously.  
`400` | Bad request. Check if you are calling the endpoint using the right JSON structure.  
`401` | Unauthorized, usually in the context of an invalid API key.  
`402` | Payment required, usually when trial accounts expire, or when API credits need to be recharged. [Learn how to buy more API credits](https://help.2chat.io/en/articles/11985717-how-to-buy-extra-credits-on-2chat).  
`403` | Operation is forbidden. For example, trying to execute a flow that is not public, or connect a WhatsApp number that already exists.  
`406` | Trying to execute an operation on a resource that doesn't support it. For example, trying to add a catalog to a non-WhatsApp Business account.  
`409` | WhatsApp number is booting up after a connection restart. Try again in a few seconds.  
`410` | WhatsApp number is in the process of connection or disconnection. Try again in a few seconds.  
`422` | Malformed or invalid request. Check if you are calling the endpoint using a number that is properly formatted (E.164 format).  
`429` | Too many requests in too short a time. Check the API for your plan, and make sure to retry the request automatically. **Trial accounts are limited to 30 requests per minute**.  
`486` | The connected number is busy executing a previous request. Try again in a few seconds.  
`503` | Service temporarily unavailable. Check the error message to clarify which service is unresponsive. Try again in a few seconds.  
`504` | Bad gateway. 2Chat API may be temporarily down. Retry the request after a few seconds.  
[Previous 💳 Billing](https://developers.2chat.co/docs/API/billing)[Next Create Contact](https://developers.2chat.co/docs/API/Contacts/create-contact)
  * [HTTP response codes](https://developers.2chat.co/docs/API/api-response-codes#http-response-codes)


Docs
  * [API & Endpoints](https://developers.2chat.co/docs/intro)
  * [Postman Collection](https://documenter.getpostman.com/view/20444184/2s946h9YKd)


Community
  * [Twitter](https://twitter.com/2Chat_)
  * [YouTube](https://www.youtube.com/@2ChatCo)
  * [LinkedIn](https://www.linkedin.com/company/2chatco/)
  * [GitHub](https://github.com/2ChatCo)


More
  * [Home](https://2chat.co)
  * [Blog](https://blog.2chat.co)
  * [Help Center](https://help.2chat.io)


Copyright © 2025 Nagence, Inc.


--- SOURCE: https://developers.2chat.co/docs/API/billing ---

[Skip to main content](https://developers.2chat.co/docs/API/billing#__docusaurus_skipToContent_fallback)
[![2Chat Logo](https://developers.2chat.co/img/2chat-logo.png) **Developers**](https://developers.2chat.co/)[Documentation](https://developers.2chat.co/docs/intro)
[🏠 Home](https://2chat.co)[📝 Blog](https://blog.2chat.co)[GitHub](https://github.com/2ChatCo)
  * [Introduction](https://developers.2chat.co/docs/intro)
  * [API](https://developers.2chat.co/docs/category/api)
    * [🔒 Authentication](https://developers.2chat.co/docs/API/authentication)
    * [💳 Billing](https://developers.2chat.co/docs/API/billing)
    * [🔢 API Response Codes](https://developers.2chat.co/docs/API/api-response-codes)
    * [👥 Contacts](https://developers.2chat.co/docs/API/billing)
    * [⚡ Webhooks](https://developers.2chat.co/docs/API/billing)
    * [📲 WhatsApp](https://developers.2chat.co/docs/API/billing)
    * [☎️ Phone Calls](https://developers.2chat.co/docs/API/billing)


  * [](https://developers.2chat.co/)
  * [API](https://developers.2chat.co/docs/category/api)
  * 💳 Billing


On this page
# Billing
Each of 2Chat's plans comes with an allotted API credit that will allow you to use the API either directly or by the use of an integration.
Every time the API is used, 1 credit is deducted from the pool of credits.
You can learn more about how the API is billed [here](https://help.2chat.io/en/articles/9688954-how-api-usage-is-billed).
## Obtaining your current API credits[​](https://developers.2chat.co/docs/API/billing#obtaining-your-current-api-credits "Direct link to Obtaining your current API credits")
Make a request to the `/info` endpoint to obtain the maximum amount of requests you can make with your plan and the current amount used.
```
curl --request GET 'https://api.p.2chat.io/open/info' \  
--header 'X-User-API-Key: my_api_key_value'  

```

```
{  
    "success": true,  
    "account": {  
        "name": "Account Name (ACC91be87af-5a29-4034-b599-342f2aeb5d52)",  
        "uuid": "ACC91be87af-5a29-4034-b599-342f2aeb5d52",  
        "on_trial": false,  
        "blocked": false,  
        "created_at": "2022-04-21T21:55:37Z",  
        "expires_at": "2024-08-31T19:11:08Z"  
    },  
    "limits": {  
        "requests_per_minute": 80  
    },  
    "usage": {  
        "api_request_count": 77112,  
        "max_api_request_count": 500000,  
        "number_check_count": 430542,  
        "max_number_check_count": 500000  
    }  
}  

```

[Previous 🔒 Authentication](https://developers.2chat.co/docs/API/authentication)[Next 🔢 API Response Codes](https://developers.2chat.co/docs/API/api-response-codes)
  * [Obtaining your current API credits](https://developers.2chat.co/docs/API/billing#obtaining-your-current-api-credits)


Docs
  * [API & Endpoints](https://developers.2chat.co/docs/intro)
  * [Postman Collection](https://documenter.getpostman.com/view/20444184/2s946h9YKd)


Community
  * [Twitter](https://twitter.com/2Chat_)
  * [YouTube](https://www.youtube.com/@2ChatCo)
  * [LinkedIn](https://www.linkedin.com/company/2chatco/)
  * [GitHub](https://github.com/2ChatCo)


More
  * [Home](https://2chat.co)
  * [Blog](https://blog.2chat.co)
  * [Help Center](https://help.2chat.io)


Copyright © 2025 Nagence, Inc.


--- SOURCE: https://developers.2chat.co/docs/intro ---

[Skip to main content](https://developers.2chat.co/docs/intro#__docusaurus_skipToContent_fallback)
[![2Chat Logo](https://developers.2chat.co/img/2chat-logo.png) **Developers**](https://developers.2chat.co/)[Documentation](https://developers.2chat.co/docs/intro)
[🏠 Home](https://2chat.co)[📝 Blog](https://blog.2chat.co)[GitHub](https://github.com/2ChatCo)
  * [Introduction](https://developers.2chat.co/docs/intro)
  * [API](https://developers.2chat.co/docs/category/api)
    * [🔒 Authentication](https://developers.2chat.co/docs/API/authentication)
    * [💳 Billing](https://developers.2chat.co/docs/API/billing)
    * [🔢 API Response Codes](https://developers.2chat.co/docs/API/api-response-codes)
    * [👥 Contacts](https://developers.2chat.co/docs/intro)
    * [⚡ Webhooks](https://developers.2chat.co/docs/intro)
    * [📲 WhatsApp](https://developers.2chat.co/docs/intro)
    * [☎️ Phone Calls](https://developers.2chat.co/docs/intro)


  * [](https://developers.2chat.co/)
  * Introduction


On this page
# Welcome to 2Chat
In here you'll learn how to adapt 2Chat to your needs in a programmatic way.
If you feel more comfortable in Postman, you can also run this API there.
The collection may be out of date. We update our API and this portal faster than we can update Postman.
[![Run in Postman](https://run.pstmn.io/button.svg)](https://god.gw.postman.com/run-collection/20444184-dd0d0d67-ce3b-42ae-8073-68e7393a0422?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D20444184-dd0d0d67-ce3b-42ae-8073-68e7393a0422%26entityType%3Dcollection%26workspaceId%3De8f71aed-453e-4642-ae2f-b8a391605a07)
## Getting Started[​](https://developers.2chat.co/docs/intro#getting-started "Direct link to Getting Started")
  * If you haven't already, you need to create a 2Chat account. You can do that [here](https://app.2chat.io/signup/).
  * After finishing creating your account, you will need to connect a channel we support. You can do that in the [channels](https://app.2chat.io/channels) section.
  * Finally, get an existing API key or create a new one to run the examples showcased in the tutorials. You can do that in the [developers section](https://app.2chat.io/developers?tab=api-access).


![2Chat API Access Screen](https://developers.2chat.co/assets/images/2chat-api-key-7bdaa0d893733770061a629aaca5e477.png)
[Next API](https://developers.2chat.co/docs/category/api)
  * [Getting Started](https://developers.2chat.co/docs/intro#getting-started)


Docs
  * [API & Endpoints](https://developers.2chat.co/docs/intro)
  * [Postman Collection](https://documenter.getpostman.com/view/20444184/2s946h9YKd)


Community
  * [Twitter](https://twitter.com/2Chat_)
  * [YouTube](https://www.youtube.com/@2ChatCo)
  * [LinkedIn](https://www.linkedin.com/company/2chatco/)
  * [GitHub](https://github.com/2ChatCo)


More
  * [Home](https://2chat.co)
  * [Blog](https://blog.2chat.co)
  * [Help Center](https://help.2chat.io)


Copyright © 2025 Nagence, Inc.


--- SOURCE: https://developers.2chat.co/docs/API/authentication ---

[Skip to main content](https://developers.2chat.co/docs/API/authentication#__docusaurus_skipToContent_fallback)
[![2Chat Logo](https://developers.2chat.co/img/2chat-logo.png) **Developers**](https://developers.2chat.co/)[Documentation](https://developers.2chat.co/docs/intro)
[🏠 Home](https://2chat.co)[📝 Blog](https://blog.2chat.co)[GitHub](https://github.com/2ChatCo)
  * [Introduction](https://developers.2chat.co/docs/intro)
  * [API](https://developers.2chat.co/docs/category/api)
    * [🔒 Authentication](https://developers.2chat.co/docs/API/authentication)
    * [💳 Billing](https://developers.2chat.co/docs/API/billing)
    * [🔢 API Response Codes](https://developers.2chat.co/docs/API/api-response-codes)
    * [👥 Contacts](https://developers.2chat.co/docs/API/authentication)
    * [⚡ Webhooks](https://developers.2chat.co/docs/API/authentication)
    * [📲 WhatsApp](https://developers.2chat.co/docs/API/authentication)
    * [☎️ Phone Calls](https://developers.2chat.co/docs/API/authentication)


  * [](https://developers.2chat.co/)
  * [API](https://developers.2chat.co/docs/category/api)
  * 🔒 Authentication


On this page
# Authentication
We enforce HTTP-header-based API-key authentication on the endpoints that provide functionality.
Your API Key can be obtained after signing up for the service, and renewed/changed at any time.
Example:
Header | Value | Description  
---|---|---  
`X-User-API-Key` | `my_api_key_value` | Your API Key  
You can generate a [new API key here](https://app.2chat.io/developers?tab=api-access).
## Test your API key[​](https://developers.2chat.co/docs/API/authentication#test-your-api-key "Direct link to Test your API key")
You can test your API key by making a request to the `info` endpoint. If it succeeds, your programmatic connection to 2Chat is ready 😏.
```
curl --request GET 'https://api.p.2chat.io/open/info' \  
--header 'X-User-API-Key: my_api_key_value'  

```

## CORS[​](https://developers.2chat.co/docs/API/authentication#cors "Direct link to CORS")
For security reasons we enforce same-origin policy. Calling this API from a browser will result in CORS errors and will also leak your API key to anyone looking the HTML or Javascript code of your site.
For example, calling `api.p.2chat.io/open/send-message` from a browser will fail, but calling that same endpoint indirectly using an endpoint that runs in your servers like `myapp.com/send-message`, will work.
[Learn more about same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy).
[Previous API](https://developers.2chat.co/docs/category/api)[Next 💳 Billing](https://developers.2chat.co/docs/API/billing)
  * [Test your API key](https://developers.2chat.co/docs/API/authentication#test-your-api-key)
  * [CORS](https://developers.2chat.co/docs/API/authentication#cors)


Docs
  * [API & Endpoints](https://developers.2chat.co/docs/intro)
  * [Postman Collection](https://documenter.getpostman.com/view/20444184/2s946h9YKd)


Community
  * [Twitter](https://twitter.com/2Chat_)
  * [YouTube](https://www.youtube.com/@2ChatCo)
  * [LinkedIn](https://www.linkedin.com/company/2chatco/)
  * [GitHub](https://github.com/2ChatCo)


More
  * [Home](https://2chat.co)
  * [Blog](https://blog.2chat.co)
  * [Help Center](https://help.2chat.io)


Copyright © 2025 Nagence, Inc.


--- SOURCE: https://developers.2chat.co/docs/API/Webhooks/supported-types ---

[Skip to main content](https://developers.2chat.co/docs/API/Webhooks/supported-types#__docusaurus_skipToContent_fallback)
[![2Chat Logo](https://developers.2chat.co/img/2chat-logo.png) **Developers**](https://developers.2chat.co/)[Documentation](https://developers.2chat.co/docs/intro)
[🏠 Home](https://2chat.co)[📝 Blog](https://blog.2chat.co)[GitHub](https://github.com/2ChatCo)
  * [Introduction](https://developers.2chat.co/docs/intro)
  * [API](https://developers.2chat.co/docs/category/api)
    * [🔒 Authentication](https://developers.2chat.co/docs/API/authentication)
    * [💳 Billing](https://developers.2chat.co/docs/API/billing)
    * [🔢 API Response Codes](https://developers.2chat.co/docs/API/api-response-codes)
    * [👥 Contacts](https://developers.2chat.co/docs/API/Webhooks/supported-types)
    * [⚡ Webhooks](https://developers.2chat.co/docs/API/Webhooks/supported-types)
      * [Supported Types](https://developers.2chat.co/docs/API/Webhooks/supported-types)
      * [List All Webhooks](https://developers.2chat.co/docs/API/Webhooks/list-all-webhooks)
      * [List Webhooks by Channel](https://developers.2chat.co/docs/API/Webhooks/list-webhooks-by-channel)
      * [Manually Subscribe to Event](https://developers.2chat.co/docs/API/Webhooks/subscribe-manually)
      * [Delete Subscription](https://developers.2chat.co/docs/API/Webhooks/delete-subscription)
      * [Logs & Troubleshooting](https://developers.2chat.co/docs/API/Webhooks/troubleshooting)
    * [📲 WhatsApp](https://developers.2chat.co/docs/API/Webhooks/supported-types)
    * [☎️ Phone Calls](https://developers.2chat.co/docs/API/Webhooks/supported-types)


  * [](https://developers.2chat.co/)
  * [API](https://developers.2chat.co/docs/category/api)
  * ⚡ Webhooks
  * Supported Types


On this page
# Subscribe to events and webhooks
You can listen for events as they happen in real-time. Each group of events is classified by channel type, like WhatsApp, SMS, or Phone Calls.
### Supported webhooks types[​](https://developers.2chat.co/docs/API/Webhooks/supported-types#supported-webhooks-types "Direct link to Supported webhooks types")
Channel | Description  
---|---  
📲 WhatsApp | See documentation [here](https://developers.2chat.co/docs/API/WhatsApp/webhooks/subscribe).  
☎️ Phone Calls | See documentation [here](https://developers.2chat.co/docs/API/Phone-Calls/webhooks/subscribe).  
💬 SMS |  _Coming soon_.  
[Previous Search Contacts](https://developers.2chat.co/docs/API/Contacts/search-contacts)[Next List All Webhooks](https://developers.2chat.co/docs/API/Webhooks/list-all-webhooks)
  * [Supported webhooks types](https://developers.2chat.co/docs/API/Webhooks/supported-types#supported-webhooks-types)


Docs
  * [API & Endpoints](https://developers.2chat.co/docs/intro)
  * [Postman Collection](https://documenter.getpostman.com/view/20444184/2s946h9YKd)


Community
  * [Twitter](https://twitter.com/2Chat_)
  * [YouTube](https://www.youtube.com/@2ChatCo)
  * [LinkedIn](https://www.linkedin.com/company/2chatco/)
  * [GitHub](https://github.com/2ChatCo)


More
  * [Home](https://2chat.co)
  * [Blog](https://blog.2chat.co)
  * [Help Center](https://help.2chat.io)


Copyright © 2025 Nagence, Inc.


--- SOURCE: https://developers.2chat.co/docs/API/WhatsApp/list-numbers ---

[Skip to main content](https://developers.2chat.co/docs/API/WhatsApp/list-numbers#__docusaurus_skipToContent_fallback)
[![2Chat Logo](https://developers.2chat.co/img/2chat-logo.png) **Developers**](https://developers.2chat.co/)[Documentation](https://developers.2chat.co/docs/intro)
[🏠 Home](https://2chat.co)[📝 Blog](https://blog.2chat.co)[GitHub](https://github.com/2ChatCo)
  * [Introduction](https://developers.2chat.co/docs/intro)
  * [API](https://developers.2chat.co/docs/category/api)
    * [🔒 Authentication](https://developers.2chat.co/docs/API/authentication)
    * [💳 Billing](https://developers.2chat.co/docs/API/billing)
    * [🔢 API Response Codes](https://developers.2chat.co/docs/API/api-response-codes)
    * [👥 Contacts](https://developers.2chat.co/docs/API/WhatsApp/list-numbers)
    * [⚡ Webhooks](https://developers.2chat.co/docs/API/WhatsApp/list-numbers)
    * [📲 WhatsApp](https://developers.2chat.co/docs/API/WhatsApp/list-numbers)
      * [List Numbers](https://developers.2chat.co/docs/API/WhatsApp/list-numbers)
      * [Get Number](https://developers.2chat.co/docs/API/WhatsApp/get-number)
      * [Set Status](https://developers.2chat.co/docs/API/WhatsApp/set-status)
      * [Set Profile Picture](https://developers.2chat.co/docs/API/WhatsApp/set-profile-picture)
      * [Send Messages](https://developers.2chat.co/docs/API/WhatsApp/send-message)
      * [Send Group Messages](https://developers.2chat.co/docs/API/WhatsApp/send-group-message)
      * [Messages](https://developers.2chat.co/docs/category/messages)
      * [Check Number](https://developers.2chat.co/docs/API/WhatsApp/check-number)
      * [Groups](https://developers.2chat.co/docs/category/groups)
      * [Webhooks](https://developers.2chat.co/docs/category/webhooks)
      * [QR Code Connection](https://developers.2chat.co/docs/category/qr-code-connection)
      * [Integrations](https://developers.2chat.co/docs/category/integrations)
      * [Catalog](https://developers.2chat.co/docs/category/catalog)
    * [☎️ Phone Calls](https://developers.2chat.co/docs/API/WhatsApp/list-numbers)


  * [](https://developers.2chat.co/)
  * [API](https://developers.2chat.co/docs/category/api)
  * 📲 WhatsApp
  * List Numbers


On this page
# List WhatsApp Numbers
This endpoint will help you list the numbers you have connected to 2Chat.
### Query parameters[​](https://developers.2chat.co/docs/API/WhatsApp/list-numbers#query-parameters "Direct link to Query parameters")
Parameter | Description | Example  
---|---|---  
`page_number` | Page number to return | `2`  
`results_per_page` | Number of results to return per page. Default is `50` | `20`  
`status` | Status of the number: `connected`, `disconnected`, `all` (default) | `connected`  
  * cURL
  * Python
  * JavaScript


```
curl -L -G 'https://api.p.2chat.io/open/whatsapp/get-numbers?page_number=0' \  
    --header 'X-User-API-Key: your_api_key_here'   

```

```
import requests  
  
url = "https://api.p.2chat.io/open/whatsapp/get-numbers?page_number=0"  
  
payload = ""  
headers = {  
  'X-User-API-Key': 'your_api_key_here'  
}  
  
response = requests.request("GET", url, headers=headers, data=payload)  
  
print(response.text)  
  

```

```
var axios = require('axios');  
var data = '';  
  
var config = {  
  method: 'get',  
  url: 'https://api.p.2chat.io/open/whatsapp/get-numbers?page_number=0',  
  headers: {   
    'X-User-API-Key': 'your_api_key_here'  
  },  
  data : data  
};  
  
axios(config)  
.then(function (response) {  
  console.log(JSON.stringify(response.data));  
})  
.catch(function (error) {  
  console.log(error);  
});  
  

```

### Response[​](https://developers.2chat.co/docs/API/WhatsApp/list-numbers#response "Direct link to Response")
The API will return an array of numbers based on the numbers you have connected to 2Chat. In the example below, only 1 number is returned.
```
{  
    "success": true,  
    "count": 1,  
    "page": 0,  
    "numbers": [  
        {  
            "uuid": "WPN95841312-b54d-46e3-b0bc-6414f4a5296b",  
            "friendly_name": "my testing number",  
            "phone_number": "+595981048477",  
            "iso_country_code": "PY",  
            "pushname": "✌️",  
            "server": "595981048477@c.us",  
            "platform": "iphone",  
            "connection_status": "C",  
            "enabled": true,  
            "is_business_profile": false,  
            "channel_type": "WW",  
            "sync_contacts": true,  
            "created_at": "2022-10-31 22:05:44",  
            "updated_at": "2022-12-01 21:40:04"  
        }  
    ]  
}  

```

Field | Description | Example values  
---|---|---  
`uuid` | The unique identifier of the number | `WPN95841312-b54d-46e3-b0bc-6414f4a5296b`  
`friendly_name` | the friendly name you chose for your number |  `my number`.  
`phone_number` | the phone number in international format | `+595981048477`  
`iso_country_code` | the two-letter country code of the number | `US`  
`pushname` | the nickname you chose on WhatsApp | `My business`  
`server` | WhatsApp-specific value | `595981048477@c.us`  
`platform` | The mobile device your WhatsApp app is running on | `android`  
`connection_status` | 2Chat value indicating the connection status to WhatsApp |  `C` = `connected`, `D` = `disconnected`, `F` = `failure`  
`enabled` | Whether the number is enabled or not on 2Chat | `true`  
`is_business_profile` | Whether the number is on Regular WhatsApp or WhatsApp for Business | `false`  
`channel_type` | The type of channel |  `WW` = `WhatsApp Web`, `IG` = `Instagram`, `SMS` = `Phone Text Messages`.  
`sync_contacts` | Whether you have enabled importing your phone directory to 2Chat | `true`  
[Previous Logs & Troubleshooting](https://developers.2chat.co/docs/API/Webhooks/troubleshooting)[Next Get Number](https://developers.2chat.co/docs/API/WhatsApp/get-number)
  * [Query parameters](https://developers.2chat.co/docs/API/WhatsApp/list-numbers#query-parameters)
  * [Response](https://developers.2chat.co/docs/API/WhatsApp/list-numbers#response)


Docs
  * [API & Endpoints](https://developers.2chat.co/docs/intro)
  * [Postman Collection](https://documenter.getpostman.com/view/20444184/2s946h9YKd)


Community
  * [Twitter](https://twitter.com/2Chat_)
  * [YouTube](https://www.youtube.com/@2ChatCo)
  * [LinkedIn](https://www.linkedin.com/company/2chatco/)
  * [GitHub](https://github.com/2ChatCo)


More
  * [Home](https://2chat.co)
  * [Blog](https://blog.2chat.co)
  * [Help Center](https://help.2chat.io)


Copyright © 2025 Nagence, Inc.


--- SOURCE: https://developers.2chat.co/docs/API/Phone-Calls/list-virtual-numbers ---

[Skip to main content](https://developers.2chat.co/docs/API/Phone-Calls/list-virtual-numbers#__docusaurus_skipToContent_fallback)
[![2Chat Logo](https://developers.2chat.co/img/2chat-logo.png) **Developers**](https://developers.2chat.co/)[Documentation](https://developers.2chat.co/docs/intro)
[🏠 Home](https://2chat.co)[📝 Blog](https://blog.2chat.co)[GitHub](https://github.com/2ChatCo)
  * [Introduction](https://developers.2chat.co/docs/intro)
  * [API](https://developers.2chat.co/docs/category/api)
    * [🔒 Authentication](https://developers.2chat.co/docs/API/authentication)
    * [💳 Billing](https://developers.2chat.co/docs/API/billing)
    * [🔢 API Response Codes](https://developers.2chat.co/docs/API/api-response-codes)
    * [👥 Contacts](https://developers.2chat.co/docs/API/Phone-Calls/list-virtual-numbers)
    * [⚡ Webhooks](https://developers.2chat.co/docs/API/Phone-Calls/list-virtual-numbers)
    * [📲 WhatsApp](https://developers.2chat.co/docs/API/Phone-Calls/list-virtual-numbers)
    * [☎️ Phone Calls](https://developers.2chat.co/docs/API/Phone-Calls/list-virtual-numbers)
      * [List Virtual Numbers](https://developers.2chat.co/docs/API/Phone-Calls/list-virtual-numbers)
      * [List Caller IDs](https://developers.2chat.co/docs/API/Phone-Calls/list-caller-ids)
      * [Webhooks](https://developers.2chat.co/docs/category/webhooks-1)


  * [](https://developers.2chat.co/)
  * [API](https://developers.2chat.co/docs/category/api)
  * ☎️ Phone Calls
  * List Virtual Numbers


On this page
# List Virtual Numbers
This endpoint will help you list the virtual numbers you have in your 2Chat account.
### Query parameters[​](https://developers.2chat.co/docs/API/Phone-Calls/list-virtual-numbers#query-parameters "Direct link to Query parameters")
Parameter | Description | Example  
---|---|---  
`page_number` | Page number to return | `2`  
`results_per_page` | Number of results to return per page. Default is `50` | `20`  
  * cURL
  * Python
  * JavaScript


```
curl -L -G 'https://api.p.2chat.io/open/voip/virtual-numbers?page_number=0' \  
    --header 'X-User-API-Key: your_api_key_here'   

```

```
import requests  
  
url = "https://api.p.2chat.io/open/voip/virtual-numbers?page_number=0"  
  
payload = ""  
headers = {  
  'X-User-API-Key': 'your_api_key_here'  
}  
  
response = requests.request("GET", url, headers=headers, data=payload)  
  
print(response.text)  
  

```

```
var axios = require('axios');  
var data = '';  
  
var config = {  
  method: 'get',  
  url: 'https://api.p.2chat.io/open/voip/virtual-numbers?page_number=0',  
  headers: {   
    'X-User-API-Key': 'your_api_key_here'  
  },  
  data : data  
};  
  
axios(config)  
.then(function (response) {  
  console.log(JSON.stringify(response.data));  
})  
.catch(function (error) {  
  console.log(error);  
});  
  

```

### Response[​](https://developers.2chat.co/docs/API/Phone-Calls/list-virtual-numbers#response "Direct link to Response")
The API will return an array of numbers based on the numbers you have connected to 2Chat. In the example below, only 1 number is returned.
```
{  
    "success": true,  
    "count": 1,  
    "page": 0,  
    "numbers": [  
        {  
            "uuid": "DID64a54de2-8ebe-4c01-838f-a2235815dab4",  
            "account_uuid": "ACC91be87af-5a29-4034-b599-342f2aeb5d52",  
            "phone_number": "+18132522492",  
            "formatted_phone_number": "+1 813-252-2492",  
            "iso_country_code": "US",  
            "region_name": "Tampa",  
            "emoji": null,  
            "friendly_name": "+18132522492",  
            "record_inbound": true,  
            "is_toll_free": false,  
            "provider_type": "local",  
            "priced_per_minute": false,  
            "incoming_price_per_minute": 0.0,  
            "ivr_uuid": null,  
            "timezone": "America/New_York",  
            "status": 1,  
            "status_text": "ACTIVE",  
            "created_at": "2025-08-13T19:46:21Z",  
            "updated_at": "2025-08-29T21:26:04Z",  
            "expires_at": "2025-09-14T13:49:56Z"  
        }  
    ]  
}  

```

Field | Description | Example values  
---|---|---  
`uuid` | The unique identifier of the number | `DID64a54de2-8ebe-4c01-838f-a2235815dab4`  
`phone_number` | the phone number in international format | `+18132522492`  
`formatted_phone_number` | the phone number in international format, formatted for easier reading | `+1 813-252-2492`  
`friendly_name` | the friendly name you chose for your number | `my number`  
`iso_country_code` | the two-letter country code of the number | `US`  
`record_inbound` |  `true` when call recording is enabled | `true`  
`is_toll_free` |  `true` when the number is toll-free | `true`  
`provider_type` | Type of number: `mobile`, `local`, `shared-cost`, `national` | `local`  
`priced_per_minute` |  `true` when the number has a charge for incoming calls | `false`  
`incoming_price_per_minute` | Price (USD) to pay per minute of incoming calls | `0.01`  
`ivr_uuid` | UUID of the associated IVR | `IVR91be87af-5a29-4034-b599-342f2aeb5d52`  
`status` | Status of the number. See `status_text` for a description | `1`  
`status_text` | Text status of the number. E.g.: `ACTIVE`, `AWAITING_REGISTRATION`, `PENDING_ACTIVATION`, `PENDING_CANCELLATION`, `RELEASED`. | `ACTIVE`  
[Previous Delete Collection](https://developers.2chat.co/docs/API/WhatsApp/catalog/delete-collection)[Next List Caller IDs](https://developers.2chat.co/docs/API/Phone-Calls/list-caller-ids)
  * [Query parameters](https://developers.2chat.co/docs/API/Phone-Calls/list-virtual-numbers#query-parameters)
  * [Response](https://developers.2chat.co/docs/API/Phone-Calls/list-virtual-numbers#response)


Docs
  * [API & Endpoints](https://developers.2chat.co/docs/intro)
  * [Postman Collection](https://documenter.getpostman.com/view/20444184/2s946h9YKd)


Community
  * [Twitter](https://twitter.com/2Chat_)
  * [YouTube](https://www.youtube.com/@2ChatCo)
  * [LinkedIn](https://www.linkedin.com/company/2chatco/)
  * [GitHub](https://github.com/2ChatCo)


More
  * [Home](https://2chat.co)
  * [Blog](https://blog.2chat.co)
  * [Help Center](https://help.2chat.io)


Copyright © 2025 Nagence, Inc.
