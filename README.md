The simple web app (built with the help of Google Gemini) generates a random verse by clicking a button. The goal of this app is to assist with testing one's memory of Bhagavad Geeta verses whether by the first quarter of the verse or by the verse number. The app provides an option to view the entire verse generated at random to check if one was able to remember the verse correctly.

There are 3 variations of the app:
1) Main App: Current Plus 2 Verses
URL: https://pranjalk2902.github.io/Geeta-Verse-Generator/
- This generates a verse and expects the user to not just remember the asked verse but also 2 verses proceeding it
- The app works in rounds and culls the full universe of 700 verses in chapter wise fashion with each round testing 18 verses from each of the 18 chapters
- The app deletes the current verse and upto 2 verses following it from the universe of 700 verses and then draws new verses from the remaining verses only to ensure the user is able to test his verse knowledge comprehensively
- The app relies on local storage of the user's device to store the number of verses completed including the round details finished. That way even if the page gets refreshed, the number of verses already practiced are preserved and not repeated
- User can do a hard reset and start from the beginning by clicking the correct button and can even reset a round of 18 verses midway
- User can even view the shlokas appearing before and after the asked verses in the Shloka display section by clicking Previous and Next buttons. Clicking them does not cull the shloka from the shloka universe

2) Current Plus 1 Verse
URL: https://pranjalk2902.github.io/Geeta-Verse-Generator/current_plus_one_verse/
- Same as Main App except it only expects only one verse after the current verse to be remembered and culls the full universe of 700 shlokas by upto 2 verses at a time

3) Shlokena Shlokaank
URL: https://pranjalk2902.github.io/Geeta-Verse-Generator/shlokena_shlokaank/
- This is a much simplified version of the main app wherein just one verse is asked at random from the universe of 700 verses
- The idea here is to just test if the user is able to recall the verse number from the 1st Charan of a verse
- The feature of being able to see the full verse is also retained
