#!/bin/bash

echo "" 
echo "Building..." 

echo "" 
echo "-- combining js files --"
echo "dev/src/services/custom-elements.js dev/src/services/utils.js dev/src/services/storage.js dev/src/services/settings.js into youtube-gaming-plus/src/popup/popup.min.js" 
cat dev/src/services/custom-elements.js dev/src/services/utils.js dev/src/services/storage.js dev/src/services/settings.js > youtube-gaming-plus/src/popup/popup.min.js
echo "dev/src/services/utils.js dev/src/services/storage.js dev/src/services/mutations.js dev/src/services/emotes.js into youtube-gaming-plus/src/services.min.js"
cat dev/src/services/custom-elements.js dev/src/services/utils.js dev/src/services/storage.js dev/src/services/mutations.js dev/src/services/emotes.js > youtube-gaming-plus/src/services.min.js
#echo "dev/src/chat/services/emotes.js into youtube-gaming-plus/src/chat/chat-services.min.js"
#cat dev/src/chat/services/emotes.js > youtube-gaming-plus/src/chat/chat-services.min.js

echo "" 
echo "-- uglifyjs --" 

if [ "$1" == '-zip' ]; then
  echo "src/background" 
  uglifyjs --compress drop_console=true --mangle --output youtube-gaming-plus/src/background.min.js --  dev/src/background.js
  echo "src/index" 
  uglifyjs --compress drop_console=true --mangle --output youtube-gaming-plus/src/index.min.js --  dev/src/index.js
  echo "src/popup/popup" 
  uglifyjs --compress drop_console=true --mangle --output youtube-gaming-plus/src/popup/popup.min.js --  youtube-gaming-plus/src/popup/popup.min.js
  echo "src/services" 
  uglifyjs --compress drop_console=true --mangle --output youtube-gaming-plus/src/services.min.js --  youtube-gaming-plus/src/services.min.js
  echo "src/chat/index" 
  uglifyjs --compress drop_console=true --mangle --output youtube-gaming-plus/src/chat/index.min.js --  dev/src/chat/index.js
  echo "src/chat/emotesInjected" 
  uglifyjs --compress drop_console=true --mangle --output youtube-gaming-plus/src/chat/emotesInjected.min.js --  dev/src/chat/emotesInjected.js
 # echo "src/chat/chat-services" 
 # uglifyjs --compress drop_console=true --mangle --output youtube-gaming-plus/src/chat/chat-services.min.js --  youtube-gaming-plus/src/chat/chat-services.min.js
else
  echo "src/background" 
  uglifyjs --compress drop_console=false --mangle --output youtube-gaming-plus/src/background.min.js --  dev/src/background.js
  echo "src/index" 
  uglifyjs --compress drop_console=false --mangle --output youtube-gaming-plus/src/index.min.js --  dev/src/index.js
  echo "src/popup/popup" 
  uglifyjs --compress drop_console=false --mangle --output youtube-gaming-plus/src/popup/popup.min.js --  youtube-gaming-plus/src/popup/popup.min.js
  echo "src/services" 
  uglifyjs --compress drop_console=false --mangle --output youtube-gaming-plus/src/services.min.js --  youtube-gaming-plus/src/services.min.js
  echo "src/chat/index" 
  uglifyjs --compress drop_console=false --mangle --output youtube-gaming-plus/src/chat/index.min.js --  dev/src/chat/index.js
  echo "src/chat/index" 
  uglifyjs --compress drop_console=false --mangle --output youtube-gaming-plus/src/chat/emotesInjected.min.js --  dev/src/chat/emotesInjected.js
  #echo "src/chat/chat-services" 
  #uglifyjs --compress drop_console=false --mangle --output youtube-gaming-plus/src/chat/chat-services.min.js --  youtube-gaming-plus/src/chat/chat-services.min.js
fi

echo "" 
echo "-- css-minify --"

echo "src/styles"
css-minify -o youtube-gaming-plus/styles -d dev/styles
echo "src/popup"
css-minify -o youtube-gaming-plus/src/popup -d dev/src/popup

echo "" 
echo "-- html-minify --"

echo "src/popup"
html-minifier --collapse-whitespace --remove-comments --use-short-doctype --minify-css true --file-ext html --output-dir youtube-gaming-plus/src/popup --input-dir dev/src/popup


echo "" 
echo "-- copy manifest --"
echo "dev/manifest.json to youtube-gaming-plus/manifest.json"
cp dev/manifest.json youtube-gaming-plus/manifest.json

echo "" 
echo "-- copy assets --"
echo "dev/assets to youtube-gaming-plus"
cp -R dev/assets youtube-gaming-plus


echo "" 
echo "-- add '.min' to file endings in scripts --" 

echo "src/index"
perl -pi -w -e 's/ytg-plus.css/ytg-plus.min.css/g;' youtube-gaming-plus/src/index.min.js;
perl -pi -w -e 's/ytg-plus-chat.css/ytg-plus-chat.min.css/g;' youtube-gaming-plus/src/chat/index.min.js;
perl -pi -w -e 's/emotesInjected.js/emotesInjected.min.js/g;' youtube-gaming-plus/src/chat/index.min.js;
perl -pi -w -e 's/\*.css/\*.min.css/g;' youtube-gaming-plus/src/chat/index.min.js;
perl -pi -w -e 's/\*.js/\*.min.js/g;' youtube-gaming-plus/src/chat/index.min.js;
echo "manifest"
perl -pi -w -e 's/DEV - //g;' youtube-gaming-plus/manifest.json;
perl -pi -w -e 's/background.js/background.min.js/g;' youtube-gaming-plus/manifest.json;
perl -pi -w -e 's/services.js/services.min.js/g;' youtube-gaming-plus/manifest.json;
#perl -pi -w -e 's/chat-services.js/chat-services.min.js/g;' youtube-gaming-plus/manifest.json;
perl -pi -w -e 's/index.js/index.min.js/g;' youtube-gaming-plus/manifest.json;
perl -pi -w -e 's/popup.js/popup.min.js/g;' youtube-gaming-plus/manifest.json;
perl -pi -w -e 's/\*.js/\*.min.js/g;' youtube-gaming-plus/manifest.json;
perl -pi -w -e 's/\*.css/\*.min.css/g;' youtube-gaming-plus/manifest.json;
perl -pi -w -e 's/ytg-plus.css/ytg-plus.min.css/g;' youtube-gaming-plus/manifest.json;
perl -pi -w -e 's/ytg-plus-chat.css/ytg-plus-chat.min.css/g;' youtube-gaming-plus/manifest.json;

#echo "src/chat/chat-services"
#perl -pi -w -e 's/\*.js/\*.min.js/g;' youtube-gaming-plus/src/chat/chat-services.min.js;

echo "" 
echo "-- add '.min' to file endings in html --" 

echo "src/popup/popup"
perl -pi -w -e 's/popup.css/popup.min.css/g;' youtube-gaming-plus/src/popup/popup.html;
perl -pi -w -e 's/popup.js/popup.min.js/g;' youtube-gaming-plus/src/popup/popup.html;
perl -pi -w -e 's/popup.js/popup.min.js/g;' youtube-gaming-plus/src/popup/popup.html;
perl -pi -w -e 's/popup.css/popup.min.css/g;' youtube-gaming-plus/src/popup/popup.min.js;
perl -pi -w -e 's/popup.js/popup.min.js/g;' youtube-gaming-plus/src/popup/popup.min.js;
perl -pi -w -e 's/popup.js/popup.min.js/g;' youtube-gaming-plus/src/popup/popup.min.js;

if [ "$1" == '-zip' ]; then
  echo "" 
  echo "zipping final folder..."
  zip -r -X youtube-gaming-plus.zip youtube-gaming-plus
fi

echo "" 
echo "COMPLETED!" 
echo "" 