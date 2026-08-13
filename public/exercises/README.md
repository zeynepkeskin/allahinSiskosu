# Exercise demonstration assets

The JPG pairs in this directory are reviewed copies of the start (`0.jpg`) and
finish (`1.jpg`) frames from [Free Exercise DB](https://github.com/yuhonas/free-exercise-db).
The upstream dataset is dedicated to the public domain under the Unlicense.

Imported: 2026-08-01; expanded: 2026-08-12

The source exercise directory name is retained as the local directory name.
`src/lib/exercise-catalog.ts` records the application exercise-name alias and
the local asset identifier used for each pair. The Burpee catalog entry has no
pair because this source does not provide a reviewed matching pair; the UI
shows an explicit unavailable state instead of substituting a different move.

The 2026-08-12 expansion added 34 reviewed start/finish pairs. When an app
label differs from the upstream title, the catalog's `demoId` remains the exact
Free Exercise DB directory name. Several proposed labels were tightened to the
movement actually shown by the source frames so the guidance stays accurate.
