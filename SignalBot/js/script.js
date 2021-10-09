var util = require('util');

const button = document.querySelector("#send-message");

button.addEventListener("click", sendSignalMessage);

function sendSignalMessage() {
	
function assertEqualArrayBuffers(ab1, ab2) {
  assert.deepEqual(new Uint8Array(ab1), new Uint8Array(ab2));
};

function hexToArrayBuffer(str) {
  var ret = new ArrayBuffer(str.length / 2);
  var array = new Uint8Array(ret);
  for (var i = 0; i < str.length/2; i++)
    array[i] = parseInt(str.substr(i*2, 2), 16);
  return ret;
};

var KeyHelper = libsignal.KeyHelper;

function generateIdentity(store) {
    return Promise.all([
        KeyHelper.generateIdentityKeyPair(),
        KeyHelper.generateRegistrationId(),
    ]).then(function(result) {
        store.put('identityKey', result[0]);
        store.put('registrationId', result[1]);
    });
}

function generatePreKeyBundle(store, preKeyId, signedPreKeyId) {
    return Promise.all([
        store.getIdentityKeyPair(),
        store.getLocalRegistrationId()
    ]).then(function(result) {
        var identity = result[0];
        var registrationId = result[1];

        return Promise.all([
            KeyHelper.generatePreKey(preKeyId),
            KeyHelper.generateSignedPreKey(identity, signedPreKeyId),
        ]).then(function(keys) {
            var preKey = keys[0]
            var signedPreKey = keys[1];

            store.storePreKey(preKeyId, preKey.keyPair);
            store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

            return {
                identityKey: identity.pubKey,
                registrationId : registrationId,
                preKey:  {
                    keyId     : preKeyId,
                    publicKey : preKey.keyPair.pubKey
                },
                signedPreKey: {
                    keyId     : signedPreKeyId,
                    publicKey : signedPreKey.keyPair.pubKey,
                    signature : signedPreKey.signature
                }
            };
        });
    });
};

var ANDREA_ADDRESS = new libsignal.SignalProtocolAddress("+16175106908", 1);
var MATT_ADDRESS = new libsignal.SignalProtocolAddress("+16187131386", 1);

var andreaStore = new SignalProtocolStore();
var mattStore = new SignalProtocolStore();
var mattPreKeyId = 1337;
var mattSignedKeyId = 1;

var Curve = libsignal.Curve;

Promise.all([
	generateIdentity(andreaStore),
    generateIdentity(mattStore),
]).then(function() {
    return generatePreKeyBundle(mattStore, mattPreKeyId, mattSignedKeyId);
}).then(function(preKeyBundle) {
    var builder = new libsignal.SessionBuilder(andreaStore, MATT_ADDRESS);
	return builder.processPreKey(preKeyBundle).then(function() {
		var originalMessage = util.toArrayBuffer("Hello, Andrea! I call you from the browser.");
		var andreaSessionCipher = new libsignal.SessionCipher(andreaStore, MATT_ADDRESS);
		var mattSessionCipher = new libsignal.SessionCipher(mattStore, ANDREA_ADDRESS);

		andreaSessionCipher.encrypt(originalMessage).then(function(ciphertext) {
		return mattSessionCipher.decryptPreKeyWhisperMessage(ciphertext.body, 'binary');
	}).then(function(plaintext) {
		alert(plaintext);
		});

			mattSessionCipher.encrypt(originalMessage).then(function(cipherText) {
			return andreaSessionCipher.decryptWhisperMessage(ciphertext.body, 'binary');
		}).then(function(plaintext) {
			asserEqualArrayBuffers(plaintext, originalMessage);
		});
	});
});
};


/*
console.log("The Javascript begins!");
const message = document.querySelector("#your-message");
const button = document.querySelector("#send-message");

console.log(message.name);
console.log(button.name);

button.addEventListener("click", sendSignalMessage);

function sendSignalMessage() {
	if (message.value === "") {
		message.value = "Nothing";
	} else {
		message.value = "Hello, World!";
	}
}

console.log("The Javascript ends!");
*/
