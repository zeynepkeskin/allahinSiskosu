# TO DO LIST

Mark the to-do items here after implementing them. Always read PRD.md and DEVELOPMENT-PLAN.md files to better understand the context. Also, update PRD doc for changes if necessary.

- [x] let's make the navigation like a drawer on the left for mobile devices.
- [x] If no meal or no exercise logged until 8pm (editable), send notification. Add notification settings for this.
- [x] workout-runner sounds are not good. The sometimes play at the same time. (Should you use async/await) Fix 3 short, 1 long beep sound. When user starts exercise, it should start with prompt and then 3-2-1 countdown with beep sounds. 1 beep for each second. First 3 are short, last one is long (1 second) After each set is completed, before the next set, the last 3 seconds of resting countdown should have beep sounds too.
- [x] remove recommendations page and add the functionality to the coach page as a seperate panel like "Can I eat..."
- [x] add "What should I eat now" button to the coach page that will check what user ate today and what they need in terms of nutritions and recommend something to eat.
- [x] update profile for logged weight in Progress page calculating the new daily calorie value.
- [x] under progress page, convert weight trend chart to line chart with the goal weight displayed as a dashed line
- [x] Exercises page should display 7 days as horizontally stacked buttons at the top. Today's day should be active. Below them, the active day's summary should be displayed with 3 buttons: Start, Mark as Done, Edit. When edit is clicked, we should display edit view by hiding summary view.
- [x] The way we are displaying exercises in the exercise selection popup is a little weird. Pictures alternate every 1 second, muscle SVGs alternate every 4 seconds. SVGs (back and front muscles) should be displayed side by side. Also "Target Muscles" P element classes are different than "Movement Preview" one. Let's make them look consistent.
- [x] The word Meals is not good. We save snacks too. Using the word "Eats" instead can make more sense.
- [x] We have mp3 files under public/soundtracks. We can play a random one in workout-runner after 3-2-1 countdown. We should also add "music on/off" button.
- [x] users should be able to delete added workout sessions
- [x] In workout-runner, add a pencil icon next to set duration and rest counters. When clicked, display an input to update the plan value so users can adjust timings during a workout.
- Editing eats edits only names. We should be able to edit nutritions as well.
- User can favorite some eats and they can add them quicly instead of using AI.
- when we hover over the bars/points on charts, we should see the values
- add connections to settings for apple health, google health, fitbit, etc
