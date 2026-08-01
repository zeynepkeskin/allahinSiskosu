# Exercise demonstration assets

The JPG pairs in this directory are reviewed copies of the start (`0.jpg`) and
finish (`1.jpg`) frames from [Free Exercise DB](https://github.com/yuhonas/free-exercise-db).
The upstream dataset is dedicated to the public domain under the Unlicense.

Imported: 2026-08-01

The source exercise directory name is retained as the local directory name.
`src/lib/exercise-catalog.ts` records the application exercise-name alias and
the local asset identifier used for each pair. The Burpee catalog entry has no
pair because this source does not provide a reviewed matching pair; the UI
shows an explicit unavailable state instead of substituting a different move.
