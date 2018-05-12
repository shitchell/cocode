var editor = null;
var editor_theme = 'vibrant_ink';
var editor_mode = 'html';
var initEditor = initCodeMirror;
var firepadUserList = null;
var firepadFrom = null;
var firepadRef = null;
var firepad;
var user_

function init() {
	initFirebase();
	firepadRef = getDatabaseRef();
	initEditor();
	firebase.auth().onAuthStateChanged(function(user) {
		user_ = user;
		if (!user) {
			firebase.auth().signInAnonymously().then(function() {
				firepad = initFirepad(firepadRef, editor, user);
				firepad.on('ready', function() {
					initUserList(firebase.auth().currentUser);
				});
			});
		} else {
			firepad = initFirepad(firepadRef, editor, user);
			firepad.on('ready', function() {
				initUserList(user);
			});
		}
	});
}

function initUserList(user) {
	users = firepadRef.child('users');
	firepadUserList = FirepadUserList.fromDiv(users, document.getElementById('user-list'), user.uid, user.displayName);
	firepadUserList.onNameChange = function(oldName, newName) {
		if (oldName !== newName) {
			toastr.info(oldName + " is now known as " + newName);
		}
	};
}

function initFirebase() {
	var config = {
		apiKey: "AIzaSyBz_UWzwrJX9OaJHirz2Phu2zXRkqglR64",
		databaseURL: "firepad-c7916.firebaseio.com"
	}
	firebase.initializeApp(config);
}

function initFirepad(ref, editor, user) {
	firepad = firepadFrom(ref, editor, {
		defaultText: '<h3>Hello World!</h3>',
		userId: user.uid
	});
	return firepad;
}

function initCodeMirror() {
	editor = CodeMirror(document.getElementById('firepad-container'), {
		mode: "htmlmixed",
		theme: "material",
		smartIndent: false,
		indentWithTabs: true,
		lineWrapping: true,
		lineNumbers: true,
		lineWiseCopyCut: false,
		autofocus: true,
		matchBrackets: true,
		autoCloseBrackets: true,
		highlightSelectionMatches: true
	});
	editor.on('change', function() { updateIframe(editor); });
	firepadFrom = Firepad.fromCodeMirror;
}

function initACE() {
	ace.require("ace/ext/language_tools");
	ace.require("ace/ext/spellcheck");
	ace.require("ace/ext/themelist");
	ace.require("ace/ext/settings_menu");
	ace.require("ace/ext/statusbar");
	editor = ace.edit("firepad-container");
	editor.setOptions({
		mode: "ace/mode/html",
		theme: "ace/theme/vibrant_ink",
		selectionStyle: "line",
		highlightActiveLine: true,
		cursorStyle: "ace",
		mergeUndoDeltas: false,
		wrapBehavioursEnabled: true,
		wrap: true,
		copyWithEmptySelection: false,
		useSoftTabs: false,
		hScrollBarAlwaysVisible: false,
		vScrollBarAlwaysVisible: false,
		animatedScroll: false,
		printMargin: false,
		fontSize: 13,
		fontFamily: "monospace",
		newLineMode: "auto",
		useSoftTabs: false,
		enableLiveAutocompletion: true,
		spellcheck: true
	});
	editor.getSession().on('change', function() { updateIframe(editor); });
	firepadFrom = Firepad.fromACE;
}

function updateIframe(editor) {
	var iframe = document.getElementById("result-container");
	iframe.src += ''; // Reload the iframe
	var doc = iframe.contentWindow.document;
	doc.open();
	doc.write(editor.getValue());
	doc.close();
}

function getDatabaseRef() {
	var ref = firebase.database().ref();
	var hash = window.location.hash.replace(/#/g, '');
	
	if (hash) {
		ref = ref.child(hash);
	} else {
		//ref = ref.push(); // Generate unique hash
		ref = ref.child("demo");
		window.location.hash = "#demo";
	}
	
	if (typeof console !== 'undefined') {
		console.log('Firebase data: ', ref.toString());
	}
	
	return ref;
}

function getUser() {
	console.log("firebase: ", firebase);
	if (!firebase.auth().currentUser) {
		firebase.auth().signInAnonymously();
	}
	
	return firebase.auth().currentUser;
}

$(document).ready(function() {
	init();
	$("#users").click(function() {
		$("#user-list").toggleClass("visible");
	});
	toastr.options = {
		closeButton: true,
		newestOnTop: false,
		positionClass: 'toast-bottom-right'
	};
});