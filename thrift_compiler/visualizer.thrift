namespace java edu.unh.cs.ai.realtimesearch.visualizer.thrift

struct Location {
  1: required i32 x,
  2: required i32 y
}

struct Iteration {
  1: required Location agentLocation,
  2: required bool clearPreviousEnvelope,
  3: required set<Location> newEnvelopeNodesCells,
  4: optional bool clearPreviousBackup,
  5: optional set<Location> newBackedUpCells,
  6: optional set<Location> projectedPath
}

struct IterationBundle {
  1: required list<Iteration> iterations,
  2: required bool bufferIsFlushed
}

struct Init {
  1: required i32 width,
  2: required i32 height,
  3: required Location start,
  4: required list<Location> goals,
  5: required set<Location> blockedCells
}

exception NoDataException{}

service Broker {
  //Should return 1 on success
  i32 ping()

  oneway void initialize(1:required Init initData),
  oneway void publishIteration(1:required Iteration itData)

  Init getInitData() throws (1:NoDataException noData)
  IterationBundle getIterations(1:required i32 offset, 2: i32 chunkSize) throws (1:NoDataException noData)
}