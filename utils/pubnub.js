const PubNub = require('pubnub');

const pubnub = new PubNub({
	publishKey: 'pub-c-803992ed-800c-4961-bd57-4f4d961e7b41',
	subscribeKey: 'sub-c-63347edc-4611-11eb-9d3f-7e8713e36938',
	//uuid: "5f93333053d406d9bbeaddd3",
	restore: true
	// logVerbosity: true,
	//heartbeatInterval: 0
});

module.exports = pubnub;
