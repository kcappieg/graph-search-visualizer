struct Location {
  1: required i64 x,
  2: required i64 y
}

struct Iteration {
  1: required bool clearPrevious,
  2: required set<Location> newEnvelopeNodesCells,
  3: optional set<Location> projectedPath
}

struct IterationBundle {
  1: required list<Iteration> iterations,
  2: required bool bufferIsFlushed
}

struct Init {
  1: required i64 width,
  2: required i64 height,
  3: required set<Location> blockedCells
}

exception NoDataException{}

service Broker {
  oneway void initialize(1:required Init initData),
  oneway void publishIteration(1:required Iteration itData)

  Init getInitData() throws (1:NoDataException noData)
  IterationBundle getIterations() throws (1:NoDataException noData)
}