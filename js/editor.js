var defaultName = "demo";
var documentName = null;
var invalidDocumentRegx = /[^A-z0-9 -]/g;
var beautify = null;
var editor = null;
var editorTheme = 'vibrant_ink';
var editorMode = 'html';
var initEditor = initACE;
var updateCount = 0;
// track favicons to reduce number of times replacing them
var faviconsCurrent = [];
var faviconsIframe = [];
var faviconsWindow = [];
var firepadUserList = null;
var firepadFrom = null;
var firepadRef = null;
var firepad;
var iframe;
var user_;

var defaultText = `<!doctype html>
<html>
<head>
	<title>My Awesome Page</title>
	<style>
		body {
			background-color: #369;
			color: white;
			font-family: sans;
		}
	</style>
</head>
<body>
	<h3>It works!</h3>
</body>
</html>
`;

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
					// Resize editor after loaded
					if (initEditor === initACE) {
						editor.resize();
					}
					// Hide loading modal
					$("#loading-modal").fadeOut();
				});
			});
		} else {
			firepad = initFirepad(firepadRef, editor, user);
			firepad.on('ready', function() {
				initUserList(user);
				if (initEditor === initACE) {
					editor.resize();
				}
				// Hide loading modal
				$("#loading-modal").fadeOut();
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
	let config = {
		apiKey: "AIzaSyBz_UWzwrJX9OaJHirz2Phu2zXRkqglR64",
		databaseURL: "firepad-c7916.firebaseio.com"
	}
	firebase.initializeApp(config);
}

function initFirepad(ref, editor, user) {
	firepad = firepadFrom(ref, editor, {
		defaultText: defaultText,
		userId: user.uid
	});
	return firepad;
}

function initCodeMirror() {
	editor = CodeMirror(document.getElementById('firepad-container'), {
		mode: "htmlmixed",
		theme: "material",
		smartIndent: false,
		indentWithTabs: false,
		lineWrapping: true,
		lineNumbers: true,
		lineWiseCopyCut: false,
		autofocus: true,
		matchBrackets: true,
		autoCloseBrackets: true,
		highlightSelectionMatches: true
	});
	editor.on('change', function() {
	    updateIframe(editor);
	    displayShortcut();
	});
	firepadFrom = Firepad.fromCodeMirror;
}

function initACE() {
	editor = ace.edit("firepad-container");
	ace.require("ace/ext/language_tools");
	ace.require("ace/ext/spellcheck");
	ace.require("ace/ext/themelist");
	ace.require("ace/ext/settings_menu").init(editor);
	beautify = ace.require("ace/ext/beautify");
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
		useSoftTabs: true,
		tabSize: 2,
		hScrollBarAlwaysVisible: false,
		vScrollBarAlwaysVisible: false,
		animatedScroll: false,
		printMargin: false,
		fontSize: 13,
		fontFamily: "monospace",
		newLineMode: "auto",
		enableLiveAutocompletion: true,
		spellcheck: true
	});
	editor.getSession().on('change', function() {
	    updateIframe(editor);
	    displayShortcut();
	});
	firepadFrom = Firepad.fromACE;
}

function updateIframe(editor) {
	iframe.src += ''; // Reload the iframe
	let doc = iframe.contentWindow.document;
	doc.open();
	doc.write(editor.getValue());
	doc.close();
	updateWindowTitle();
	updateFavicons();
	updateCount++;
}

function displayShortcut() {
    if (!localStorage["settingsShortcutDisplayed"] && updateCount > 1) {
        toastr.info("<code>ctrl</code>+<code>,</code> for code editor settings");
        localStorage["settingsShortcutDisplayed"] = true;
    }
}

// Update the window title based on the iframe title
function updateWindowTitle() {
	iframeTitle = iframe.contentDocument.title;
	if (iframeTitle) {
		if (iframeTitle.length > 20) {
			iframeTitle = iframeTitle.substr(0, 20).trim() + "...";
		}
		document.title = `cc:${documentName} | ${iframeTitle}`;
	} else {
		document.title = "cocode:" + documentName;
	}
}

// Use favicons from the iframe if available, else use the default favicons
function updateFavicons() {
	faviconsIframe = $(iframe).contents().find("link[rel=icon]").map((i, el) => el.href).toArray();
	let updatedFavicons = null;
	if (faviconsIframe.length > 0) {
		// found favicons in the iframe, now check if we're already using them
		if (faviconsIframe.toString() !== faviconsCurrent.toString()) {
			// they don't match the current favicons, so update
			updatedFavicons = faviconsIframe;
			console.log("[updateFavicons()] updating to iframe favicons");
		}
	} else if (faviconsCurrent.toString() !== faviconsWindow.toString()) {
		// since there are no iframe favicons, use the default ones,
		// but only if we're not already using them
		updatedFavicons = faviconsWindow;
		console.log("[updateFavicons()] updating to default favicons");
	}

	if (updatedFavicons !== null) {
		setFavicons(updatedFavicons);
		faviconsCurrent = updatedFavicons;
		console.log("[updateFavicons()", faviconsCurrent);
	}
}

// Save each href from each favicon found at startup
function saveFavicons() {
	faviconsWindow = $("link[rel=icon]").map((i, el) => el.href).toArray();
}

// Replace any current favicons with those generated from an array of urls
function setFavicons(urlArray) {
	// remove current favicons
	$("link[rel=icon]").remove();
	
	// create and add favicons
	urlArray.forEach(function(url) {
		let link = document.createElement("link");
		link.rel = "icon";
		link.href = url;
		$("head").append(link);
	});
}

function getDatabaseRef() {
	let ref = firebase.database().ref();
	console.log('[getDatabaseRef()] documentName: ' + documentName);
	
	if (documentName) {
		ref = ref.child(documentName);
	} else {
		// use default
		documentName = defaultName;
		ref = ref.child(defaultName);

		// redirect to default
		// console.log('[getDatabaseRef()] redirecting to default')
		// window.location.search = "?" + defaultName;

		// generate unique hash
		//ref = ref.push();
	}
	
	if (typeof console !== 'undefined') {
		console.log('Firebase data: ', ref.toString());
	}
	
	return ref;
}

// create a valid document name
function sanitizeDocumentName(name) {
	// only allow letters/numbers and replace spaces with '-'
	return name.replaceAll(' ', '-').replace(invalidDocumentRegx, '');
}

// Update the documentName var
function updateName() {
	documentName = window.location.search.replace(/^\?/, '').toLowerCase() || defaultName;
	documentName = sanitizeDocumentName(documentName);
	document.getElementById('document-name').value = documentName;
	updateWindowTitle();
	$(".document-name").text("." + documentName);
	console.log('[updateName()] ' + documentName);
}

function getUser() {
	console.log("firebase: ", firebase);
	if (!firebase.auth().currentUser) {
		firebase.auth().signInAnonymously();
	}

	return firebase.auth().currentUser;
}

function switchDocument(e) {
	// prevent form submission
	e.preventDefault();

	let name = document.getElementById('document-name').value.toLowerCase();

	// remove funky characters from the document name
	name = sanitizeDocumentName(name);

	console.log("switching to: " + name);
	window.location.search = "?" + name;
}

$(document).ready(function() {
	// set the iframe
	iframe = document.getElementById("result-container");

	// get the current/default favicons
	saveFavicons();

	// update the document name
	updateName();

	// setup the document switcher
	$("#name-form").submit(switchDocument);

	// start firepad
	console.log('[document.ready] init');
	init();
	console.log('[document.ready] init complete');

	// make user list toggleable
	$("#users").click(function() {
		$("#user-list").toggleClass("visible");
	});

	// enable expand/collapse buttons
	$(".fullscreen-toggle").click(() => {
		$("body").toggleClass("fullscreen");
		console.log("fullscreen:", $("body").hasClass("fullscreen"));
	});

	toastr.options = {
		closeButton: true,
		newestOnTop: false,
		positionClass: 'toast-bottom-right'
	};
});