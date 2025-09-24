var api_key = ' 5865a7572ef357a0a9f5eecd1b9ba667',
	api_secret = 'db3236c9306d1169',

	stdin = process.stdin;

import http from "http"
import RememberTheMilk from 'rtm-js'
let rtm = new RememberTheMilk(api_key, api_secret, 'delete');

rtm.get('rtm.auth.getFrob', function(resp){
	let frob = resp.rsp.frob;

	var authUrl = rtm.getAuthUrl(frob);

	console.log('Please visit the following URL in your browser to authenticate:\n');
	console.log(authUrl, '\n');
	console.log('After authenticating, press any key to resume...');

	stdin.resume();

	stdin.on('data', function() {
		rtm.get('rtm.auth.getToken', {frob: frob}, function(resp){
			if (!resp.rsp.auth) {
				console.log('Auth token not found. Did you authenticate?\n');
				process.exit(1);
			}

			rtm.auth_token = resp.rsp.auth.token;

			console.log('Lists:');

			rtm.get('rtm.lists.getList', function(resp){
				var i, list;

				for (i = 0; i < resp.rsp.lists.list.length; i++) {
					list = resp.rsp.lists.list[i];
					console.log(list.name + ' (id: ' + list.id + ')');
				}

				console.log();

				process.exit();
			});
		});
	});
});