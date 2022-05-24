onInputChange_:function(){var a=this.getCurrentRange_();if(a){var b=this.calculateTextBeforeRange_(a);this.completeEmojis_(a,b,!0)||this.updateSuggestions_(a,b)}a=this.calculateLiveChatRichMessageInput_();this._setLiveChatRichMessageInput(a);this.fire("yt-live-chat-message-input-change",a)},
getCurrentRange_:function(){var a=window.getSelection();return a.rangeCount?a.getRangeAt(0).cloneRange():null},
getInputRange_:function(){var a=this.getCurrentRange_();if(a){for(var b=a.commonAncestorContainer,c=!1;b;){if(b==this.$.input){c=!0;break}b=b.parentNode}c||(a=null)}a||(a=this.getRangeAtEnd_());return a},
getRangeAtEnd_:function(){var a=document.createRange();this.$.input.lastChild?a.setStart(this.$.input.lastChild,this.$.input.lastChild.length):(a.selectNodeContents(this.$.input),a.collapse(!1));return a},
getSuggestions_:function(a){var b=[],c=a.substr(0,3),d=nba(this.emojiManager,c);if(d)for(var e in d)if(0==e.toLocaleLowerCase().indexOf(a)){var f=d[e];if(f&&f.emojiId){f=h1(this.emojiManager,f.emojiId);var g=void 0;g=f.image&&f.image.accessibility&&f.image.accessibility.accessibilityData?f.image.accessibility.accessibilityData.label:f.isCustomEmoji?f.shortcuts[0]:f.emojiId;b.push({suggestion:{emoji:!0,image:f.image,alt:g,text:e,textToInsertWhenSelected:f.isCustomEmoji?e:g}});if(b.length>=this.MAX_SUGGESTIONS)break}}if(!this.participantsManager)return null;
if(0==c.indexOf("@")||0==c.indexOf("#"))if(d=c.substr(0,1),a=a.substr(1),c=c.substr(1),c=this.participantsManager.getAuthorsFromPrefix(c))for(var h in c)if(0==h.indexOf(a)&&(e=c[h],f=pz(e.authorName),b.push({suggestion:{author:!0,authorType:d,image:e.authorPhoto,alt:f,text:f}}),b.length>=this.MAX_SUGGESTIONS))break;return b?b.sort(function(k,l){return l.suggestion.text<k.suggestion.text?-1:l.suggestion.text==k.suggestion.text?0:1}):null},
insertSuggestion_:function(a){a.emoji?this.insertTextAtRange_(this.lastSuggestionRange_,a.textToInsertWhenSelected):a.author&&this.insertTextAtRange_(this.lastSuggestionRange_,a.authorType+a.text+this.NBSP)},
updateSuggestionsAtCaret_:function(){var a=this.getCurrentRange_();a&&this.updateSuggestions_(a,this.calculateTextBeforeRange_(a))},
offsetStartOfRangeBy_:function(a,b){for(;0<b;)if(0<=a.startOffset-b){a.setStart(a.startContainer,a.startOffset-b);break}else{b=a.startContainer instanceof HTMLImageElement?b-a.startContainer.alt.length:b-a.startOffset;var c=a.startContainer.previousSibling;if(!c){a.setStart(a.startContainer,0);break}a.setStart(c,c.length||0)}},
updateSuggestions_:function(a,b){this.lastSuggestionRange_&&(this.lastSuggestionRange_.detach(),this.lastSuggestionRange_=null);if((b=this.SPLIT_REGEX.exec(b))&&b.length&&(b=b[b.length-1].toLocaleLowerCase(),2<b.length&&(this.offsetStartOfRangeBy_(a,b.length),this.lastSuggestionRange_=a,(a=this.getSuggestions_(b))&&a.length))){this.suggestions=a;pw(this,function(){this.$["dropdown-content"].scrollTop=Math.pow(2,24)});
this.$.dropdown.opened?this.$.dropdown.notifyResize():this.$.dropdown.opened=!0;this.suggestionIndex_=-1;this.changeSuggestionIndex_(a.length-1);return}this.$.dropdown.opened=!1},
completeEmojis_:function(a,b,c){var d=b.replace(/[\s\xa0]+$/,"");b=b.length-d.length;d=d.split(" ");d=d[d.length-1].trim().toLocaleLowerCase();var e=d.lastIndexOf(":");if(c&&!b&&e!=d.length-1)return!1;-1!=e&&(c=d.lastIndexOf(":",e-1),-1!=c&&(d=d.substring(c)));return(c=c1(this.emojiManager,d))&&c.emojiId?(c=h1(this.emojiManager,c.emojiId),this.offsetStartOfRangeBy_(a,d.length+b),c=(c.isCustomEmoji?c.shortcuts[0]:c.emojiId)||"",b&&(c+=this.NBSP),this.insertTextAtRange_(a,c),this.$.dropdown.opened=
!1,!0):!1},
onSuggestion_:function(a){this.insertSuggestion_(a.detail);this.$.dropdown.opened=!1},
document.querySelector('yt-live-chat-text-input-field-renderer').onSuggestion_({detail: {emoji: true, textToInsertWhenSelected: '', author: '', authorType: '', text: ''}})
onKeyPress_:function(a){13==a.keyCode&&(a.preventDefault(),this.$.dropdown.opened?(this.insertSuggestion_(this.suggestions[this.suggestionIndex_].suggestion),this.$.dropdown.opened=!1):this.fire("yt-live-chat-send-message"))},
completeEmojis:function(){var a=document.createRange();this.$.input.lastChild?a.setStart(this.$.input.lastChild,this.$.input.lastChild.length):(a.selectNodeContents(this.$.input),a.collapse(!1));this.completeEmojis_(a,this.calculateTextBeforeRange_(a),!1)},
maybePreventTextFormatting_:function(a){!be||!a.ctrlKey&&!a.metaKey||66!==a.keyCode&&73!==a.keyCode||(a.stopImmediatePropagation(),a.preventDefault())},
onKeyDown_:function(a){this.maybePreventTextFormatting_(a);if(this.$.dropdown.opened)switch(a.keyCode){case 27:this.$.dropdown.opened=!1;a.stopPropagation();break;case 9:this.insertSuggestion_(this.suggestions[this.suggestionIndex_].suggestion);this.$.dropdown.opened=!1;a.preventDefault();break;case 38:this.changeSuggestionIndex_(this.suggestionIndex_-1);a.preventDefault();break;case 40:this.changeSuggestionIndex_(this.suggestionIndex_+1),a.preventDefault();}},
onKeyUp_:function(a){switch(a.keyCode){case 37:case 39:this.updateSuggestionsAtCaret_();break;case 38:case 40:this.$.dropdown.opened||this.updateSuggestionsAtCaret_();}if(Gd)this.onInputChange_()},
changeSuggestionIndex_:function(a){if(this.$.dropdown.opened){var b=this.$["dropdown-content"];0<=this.suggestionIndex_&&this.suggestionIndex_<b.children.length&&(b.children[this.suggestionIndex_].active=!1);this.suggestionIndex_=(a+this.suggestions.length)%this.suggestions.length;a=b.children[this.suggestionIndex_];a.active=!0;b.scrollTop=a.offsetTop}},
document.querySelector('yt-live-chat-text-input-field-renderer').changeSuggestionIndex_(1)
onInputPaste_:function(a){a.preventDefault();(a=a.clipboardData)&&a.types&&(a=a.getData("text/plain")||"",a=a.replace(/\n/g,""),this.insertText_(a))},
onFocus_:function(){this._setFocused(!0)},
onBlur_:function(){this._setFocused(!1)},
insertText_:function(a){this.insertTextAtRange_(this.getInputRange_(),a)},
insertTextAtRange_:function(a,b){if(a){a.collapsed||a.deleteContents();if(this.emojiManager){b=this.emojiManager.createDocumentFragment(b,!0,!1);for(var c=q(b.childNodes),d=c.next();!d.done;d=c.next())window.ShadyCSS.ScopingShim.scopeNode(d.value,this.localName);c=b.lastChild;a.insertNode(b);this.focused&&(a=a.cloneRange(),a.selectNodeContents(c),a.collapse(!1),b=window.getSelection(),b.removeAllRanges(),b.addRange(a))}a=this.calculateLiveChatRichMessageInput_();this._setLiveChatRichMessageInput(a);
setLiveChatRichMessageInput:function(a){this.$.input.textContent="";if(a&&a.textSegments){for(var b=0;b<a.textSegments.length;b++){var c=a.textSegments[b];c.text?this.$.input.appendChild(this.emojiManager.createDocumentFragment(c.text,!0,!1)):c.emojiId&&(c=b1(this.emojiManager,c.emojiId))&&this.$.input.appendChild(this.emojiManager.createEmoji(c,!1))}this._setLiveChatRichMessageInput(this.calculateLiveChatRichMessageInput_())}else this._setLiveChatRichMessageInput(null)},
document.querySelector('yt-live-chat-text-input-field-renderer').setLiveChatRichMessageInput({textSegments: [{text: 'FeelsGoodMan', emojiId: 'FeelsGoodMan'}]})
document.querySelector('yt-live-chat-text-input-field-renderer').emojiManager.createEmoji(c,!1)
setText:function(a){this.setLiveChatRichMessageInput(a?{textSegments:[{text:a}]}:null)},
document.querySelector('yt-live-chat-text-input-field-renderer').setText('FeelsGoodMan')
calculateTextBeforeRange_:function(a){var b="",c=a.startContainer;c instanceof Text&&(b=c.textContent.substr(0,a.startOffset),c=c.previousSibling);for(;c&&c instanceof Text;)b=c.textContent+b,c=c.previousSibling;return b.replace(this.NBSP_REGEX," ")},
calculateLiveChatRichMessageInput_:function(){for(var a=[],b="",c=this.$.input.childNodes,d=0;d<c.length;d++){var e=c[d];e instanceof Text?b+=e.textContent:e instanceof HTMLImageElement&&(e.dataset.emojiId?(b&&(a.push({text:b.replace(this.NBSP_REGEX," ")}),b=""),a.push({emojiId:e.dataset.emojiId})):b+=e.alt)}b&&a.push({text:b.replace(this.NBSP_REGEX," ")});return{textSegments:a}},
computeMaxCharacterLimit_:function(a){return a||0},
computeHasText_:function(a){return 0<a},
computeCharacterCount_:function(a){if(!a)return 0;for(var b=0,c=0;c<a.textSegments.length;c++){var d=a.textSegments[c];d.text?b+=d.text.length:d.emojiId&&(b=this.data.emojiCharacterCount?b+this.data.emojiCharacterCount:b+b1(this.emojiManager,d.emojiId).shortcuts[0].length)}return b},
computedIsInputValid:function(){return 0===this.characterCount?this.isValidWithNoInputText:this.characterCount<=this.maxCharacterLimit},
characterCountChanged_:function(a){this.fire("yt-live-chat-text-input-field-renderer-character-count-changed",{characterCount:a})},
focus:function(){this.setFocus_(!1)},
focusAtEnd:function(){this.setFocus_(!0)},
document.querySelector('yt-live-chat-text-input-field-renderer').focusAtEnd()
setFocus_:function(a){a=a?this.getRangeAtEnd_():this.getInputRange_();this.$.input.focus();var b=window.getSelection();b.removeAllRanges();b.addRange(a)},
insertEmoji:function(a){this.insertText_((a.isCustomEmoji?a.shortcuts[0]:a.emojiId)||"")},
document.querySelector('yt-live-chat-text-input-field-renderer').insertEmoji({isCustomEmoji: true, shortcuts: [':FeelsGoodMan:'], emojiId: 'FeelsGoodMan'})
// document.querySelector('yt-live-chat-text-input-field-renderer').insertEmoji({isCustomEmoji: true, shortcuts: [':FeelsGoodMan:'], emojiId: 'FeelsGoodMan'})
computeText_:function(a){if(!a)return"";for(var b="",c=0;c<a.textSegments.length;c++){var d=a.textSegments[c];d.text?b+=d.text:d.emojiId&&(b+=b1(this.emojiManager,d.emojiId).shortcuts[0])}return b},
computeInputTabIndex_:function(a){return a?-1:0}});function i1(a){if(!a)return null;for(var b=[],c=0;c<a.textSegments.length;c++){var d=a.textSegments[c];d.text?b.push(d):d.emojiId&&b.push({emoji_id:d.emojiId})}return{text_segments:b}}


X1.prototype.load=function(a,b){if(b)if(a.length)a=a.concat(b.emojis);else{this.emojis=b.emojis;this.emojiMap=b.emojiMap;this.emojiShortcutMap=b.emojiShortcutMap;this.emojiShortcutCharMap=Y1(b);this.hasInitializedShortcutCharMap=!0;this.emojiRegex=b.emojiRegex;return}this.emojis=[].concat(t(new Set(this.emojis.concat(a))));this.hasInitializedShortcutCharMap=!1;a=Array(this.emojis.length);for(b=0;b<this.emojis.length;b++){var c=this.emojis[b];if(c.emojiId){this.emojiMap[c.emojiId]=c;this.emojiMap[c.emojiId].index=
b;for(var d=0;c.shortcuts&&d<c.shortcuts.length;d++)this.emojiShortcutMap[c.shortcuts[d].toLocaleLowerCase()]=c;a[b]=c.isCustomEmoji&&c.shortcuts?c.shortcuts[0]:c.emojiId}}a.sort(function(e,f){return f.length-e.length});
if(a.length)try{this.emojiRegex=new RegExp(a.join("|").replace("*","\\*"),"gi")}catch(e){this.emojiRegex=/$./}else this.emojiRegex=/$./};
var b1=function(a,b,c){return(a=a.emojiMap[b])&&(!a.isLocked||void 0!==c&&c)?a:void 0},h1=function(a,b,c){c=b1(a,b,void 0===c?!1:c);
var d=b.match("\u200D");c&&0!==a.skinTone&&(a=1===(null===d||void 0===d?void 0:d.length)?b1(a,b.replace("\u200D",W1[a.skinTone]+"\u200D")):b1(a,b+W1[a.skinTone]))&&(c=a);return c},c1=function(a,b){a=a.emojiShortcutMap[b.toLocaleLowerCase()];
return!a||a.isLocked?null:a},nba=function(a,b){return Y1(a)[b]||{}},Y1=function(a){if(!a.hasInitializedShortcutCharMap){a.hasInitializedShortcutCharMap=!0;
for(var b=0;b<a.emojis.length;b++){var c=a.emojis[b];if(!c.isLocked)for(var d=0;c.shortcuts&&d<c.shortcuts.length;d++){var e=c.shortcuts[d];e.startsWith(":_")&&c.isCustomEmoji&&(null==a.emojiShortcutCharMap[":_"]&&(a.emojiShortcutCharMap[":_"]=Object.create(null)),a.emojiShortcutCharMap[":_"][e]=c);if(!(3>e.length||!c.isCustomEmoji&&tba.test(e))){var f=e.substr(0,3).toLocaleLowerCase();null==a.emojiShortcutCharMap[f]&&(a.emojiShortcutCharMap[f]=Object.create(null));a.emojiShortcutCharMap[f][e]=c}}}}return a.emojiShortcutCharMap};


X1.prototype.createEmoji=function(a,b){b=void 0===b?!0:b;var c=document.createElement("img");J(a.isCustomEmoji?"render_custom_emojis_as_small_images":"render_unicode_emojis_as_small_images")&&c.classList.add("small-emoji");c.classList.add("emoji");c.classList.add("yt-formatted-string");c.src=a.image?WJ(a.image.thumbnails,this.emojiSize)||"":"";var d=void 0;a.image&&a.image.accessibility&&a.image.accessibility.accessibilityData&&(d=a.image.accessibility.accessibilityData.label);c.alt=d?d:(a.isCustomEmoji&&
a.shortcuts?a.shortcuts[0]:a.emojiId)||"";a.isCustomEmoji&&(c.dataset.emojiId=a.emojiId);Gd&&(c.setAttribute("contenteditable","false"),c.setAttribute("unselectable","on"));b&&(a.shortcuts&&a.shortcuts.length&&c.setAttribute("shared-tooltip-text",a.shortcuts[0]),c.id="emoji-"+sba++);return c};
createEmoji({
  emojiId: "UCkszU2WH9gy1mb0dV-11UJg/CIW60IPp_dYCFcuqTgodEu4IlQ",
  image: {
    accessibility: {
      accessibilityData: {
        label: "yt"
      }
    },
    thumbnails: [{
      height: 24,
      url: "https://yt3.ggpht.com/m6yqTzfmHlsoKKEZRSZCkqf6cGSeHtStY4rIeeXLAk4N9GY_yw3dizdZoxTrjLhlY4r_rkz3GA=w24-h24-c-k-nd",
      width: 24,
    },
    {
      height: 48,
      url: "https://yt3.ggpht.com/m6yqTzfmHlsoKKEZRSZCkqf6cGSeHtStY4rIeeXLAk4N9GY_yw3dizdZoxTrjLhlY4r_rkz3GA=w48-h48-c-k-nd",
      width: 48,
    }]
  },
  index: 0,
  isCustomEmoji: true,
  searchTerms: ["yt"],
  shortcuts: [":yt:"],
})