var eventPage = new (function () {

	var me = this;

	function init() {
		chrome.runtime.onMessage.addListener(onMessageReceived);

		createContextMenus();

		chrome.contextMenus.onClicked.addListener(onContextMenuClicked);
	}

	function createContextMenus() {
		chrome.contextMenus.create({
			id: "addKeyword", 
			title: "Add \"%s\"", 
			contexts: ["selection"]
		});

		var skills = storage.getSkills();

		for (var key in skills) {
			var skill = skills[key];
			me.createAddKeywordContextMenuForSkill(skill.name, true);
		}

		if (Object.keys(skills).length > 0) {
			chrome.contextMenus.create({
				id: "addAsNew", 
				title: "As new...",
				parentId: "addKeyword", 
				contexts: ["selection"]
			});
		}
		
		chrome.contextMenus.create({
			id: "compose", 
			title: "Compose", 
			contexts: ["editable"]
		});
	}

	this.createAddKeywordContextMenuForSkill = function(skillName, dontCreateAddAsNew) {
		chrome.contextMenus.create({
			id: "addTo_" + skillName, 
			title: "to " + skillName, 
			parentId: "addKeyword", 
			contexts: ["selection"]
		}, function() {
			if (!dontCreateAddAsNew) {
				chrome.contextMenus.remove("addAsNew", function() {
					chrome.contextMenus.create({
						id: "addAsNew", 
						title: "As new...",
						parentId: "addKeyword", 
						contexts: ["selection"]
					});
				});
			}
		});
	}

	this.removeAddKeywordContextMenuForSkill = function(skillName) {		
		chrome.contextMenus.remove("addTo_" + skillName);

		var skills = storage.getSkills();
		if (Object.keys(skills).length == 0) {
			chrome.contextMenus.remove("addAsNew");
		}
	}

	function searchResultsReceived(result, tabId) {
		if (result.foundWords) {
			chrome.browserAction.setIcon({
				path: "assets/red.png", 
				tabId: tabId
			});
		}
		else {
			chrome.browserAction.setIcon({
				path: "assets/gray.png", 
				tabId: tabId
			});
		}
	}

	function onMessageReceived(request, sender, sendResponse) {
		if (request.message == "search-result") {
			searchResultsReceived(request, sender.tab.id);
		}
		else if (request.message == "get-keywords") {
			var keywords = storage.getKeywords();
			sendResponse(keywords);
		}
		else if (request.message == "get-skills") {
			var skills = storage.getSkills();
			sendResponse(skills);
		}
	}

	function onContextMenuClicked(info, tab) {
		if (info.menuItemId == "addKeyword") {
			var keyword = info.selectionText.trim();
			createNewSkillWithKeywords([keyword]);
		}
		else if (info.parentMenuItemId == "addKeyword") {
			onAddKeywordClicked(info, tab);
		}
		else if (info.menuItemId == "compose") {
			chrome.tabs.sendMessage(tab.id, { message: "compose-textbox" });
		}
	}

	function onAddKeywordClicked(info, tab) {
		var keyword = info.selectionText.trim();
		if (info.menuItemId == "addAsNew") {
			createNewSkillWithKeywords([keyword]);
		}
		else {
			var skillName = info.menuItemId.split("_")[1];
			storage.addKeywordToSkill(skillName, keyword);
			highlightKeywords(storage.getKeywords(), tab.id);
		}
	}

	function createNewSkillWithKeywords(keywords) {
		chrome.tabs.create({ url: "/skills/edit.html?keywords=" + encodeURIComponent(JSON.stringify(keywords)) });
	}

	function highlightKeywords(keywords, tabId) {
		chrome.tabs.sendMessage(tabId, { message: "search-keywords", keywords: keywords });
	}

	init();

})();
