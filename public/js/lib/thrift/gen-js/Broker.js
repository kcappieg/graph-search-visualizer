//
// Autogenerated by Thrift Compiler (0.11.0)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//


//HELPER FUNCTIONS AND STRUCTURES

import Thrift from "../thrift.js";

const Broker_initialize_args = function(args) {
  this.initData = null;
  if (args) {
    if (args.initData !== undefined && args.initData !== null) {
      this.initData = new Init(args.initData);
    } else {
      throw new Thrift.TProtocolException(Thrift.TProtocolExceptionType.UNKNOWN, 'Required field initData is unset!');
    }
  }
};
Broker_initialize_args.prototype = {};
Broker_initialize_args.prototype.read = function(input) {
  input.readStructBegin();
  while (true)
  {
    var ret = input.readFieldBegin();
    var fname = ret.fname;
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid)
    {
      case 1:
      if (ftype == Thrift.Type.STRUCT) {
        this.initData = new Init();
        this.initData.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 0:
        input.skip(ftype);
        break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

Broker_initialize_args.prototype.write = function(output) {
  output.writeStructBegin('Broker_initialize_args');
  if (this.initData !== null && this.initData !== undefined) {
    output.writeFieldBegin('initData', Thrift.Type.STRUCT, 1);
    this.initData.write(output);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

const Broker_initialize_result = function(args) {
};
Broker_initialize_result.prototype = {};
Broker_initialize_result.prototype.read = function(input) {
  input.readStructBegin();
  while (true)
  {
    var ret = input.readFieldBegin();
    var fname = ret.fname;
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    input.skip(ftype);
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

Broker_initialize_result.prototype.write = function(output) {
  output.writeStructBegin('Broker_initialize_result');
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

const Broker_publishIteration_args = function(args) {
  this.itData = null;
  if (args) {
    if (args.itData !== undefined && args.itData !== null) {
      this.itData = new Iteration(args.itData);
    } else {
      throw new Thrift.TProtocolException(Thrift.TProtocolExceptionType.UNKNOWN, 'Required field itData is unset!');
    }
  }
};
Broker_publishIteration_args.prototype = {};
Broker_publishIteration_args.prototype.read = function(input) {
  input.readStructBegin();
  while (true)
  {
    var ret = input.readFieldBegin();
    var fname = ret.fname;
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid)
    {
      case 1:
      if (ftype == Thrift.Type.STRUCT) {
        this.itData = new Iteration();
        this.itData.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 0:
        input.skip(ftype);
        break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

Broker_publishIteration_args.prototype.write = function(output) {
  output.writeStructBegin('Broker_publishIteration_args');
  if (this.itData !== null && this.itData !== undefined) {
    output.writeFieldBegin('itData', Thrift.Type.STRUCT, 1);
    this.itData.write(output);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

const Broker_publishIteration_result = function(args) {
};
Broker_publishIteration_result.prototype = {};
Broker_publishIteration_result.prototype.read = function(input) {
  input.readStructBegin();
  while (true)
  {
    var ret = input.readFieldBegin();
    var fname = ret.fname;
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    input.skip(ftype);
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

Broker_publishIteration_result.prototype.write = function(output) {
  output.writeStructBegin('Broker_publishIteration_result');
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

const Broker_getInitData_args = function(args) {
};
Broker_getInitData_args.prototype = {};
Broker_getInitData_args.prototype.read = function(input) {
  input.readStructBegin();
  while (true)
  {
    var ret = input.readFieldBegin();
    var fname = ret.fname;
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    input.skip(ftype);
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

Broker_getInitData_args.prototype.write = function(output) {
  output.writeStructBegin('Broker_getInitData_args');
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

const Broker_getInitData_result = function(args) {
  this.success = null;
  this.noData = null;
  if (args instanceof NoDataException) {
    this.noData = args;
    return;
  }
  if (args) {
    if (args.success !== undefined && args.success !== null) {
      this.success = new Init(args.success);
    }
    if (args.noData !== undefined && args.noData !== null) {
      this.noData = args.noData;
    }
  }
};
Broker_getInitData_result.prototype = {};
Broker_getInitData_result.prototype.read = function(input) {
  input.readStructBegin();
  while (true)
  {
    var ret = input.readFieldBegin();
    var fname = ret.fname;
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid)
    {
      case 0:
      if (ftype == Thrift.Type.STRUCT) {
        this.success = new Init();
        this.success.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 1:
      if (ftype == Thrift.Type.STRUCT) {
        this.noData = new NoDataException();
        this.noData.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

Broker_getInitData_result.prototype.write = function(output) {
  output.writeStructBegin('Broker_getInitData_result');
  if (this.success !== null && this.success !== undefined) {
    output.writeFieldBegin('success', Thrift.Type.STRUCT, 0);
    this.success.write(output);
    output.writeFieldEnd();
  }
  if (this.noData !== null && this.noData !== undefined) {
    output.writeFieldBegin('noData', Thrift.Type.STRUCT, 1);
    this.noData.write(output);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

const Broker_getIterations_args = function(args) {
};
Broker_getIterations_args.prototype = {};
Broker_getIterations_args.prototype.read = function(input) {
  input.readStructBegin();
  while (true)
  {
    var ret = input.readFieldBegin();
    var fname = ret.fname;
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    input.skip(ftype);
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

Broker_getIterations_args.prototype.write = function(output) {
  output.writeStructBegin('Broker_getIterations_args');
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

const Broker_getIterations_result = function(args) {
  this.success = null;
  this.noData = null;
  if (args instanceof NoDataException) {
    this.noData = args;
    return;
  }
  if (args) {
    if (args.success !== undefined && args.success !== null) {
      this.success = new IterationBundle(args.success);
    }
    if (args.noData !== undefined && args.noData !== null) {
      this.noData = args.noData;
    }
  }
};
Broker_getIterations_result.prototype = {};
Broker_getIterations_result.prototype.read = function(input) {
  input.readStructBegin();
  while (true)
  {
    var ret = input.readFieldBegin();
    var fname = ret.fname;
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid)
    {
      case 0:
      if (ftype == Thrift.Type.STRUCT) {
        this.success = new IterationBundle();
        this.success.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 1:
      if (ftype == Thrift.Type.STRUCT) {
        this.noData = new NoDataException();
        this.noData.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

Broker_getIterations_result.prototype.write = function(output) {
  output.writeStructBegin('Broker_getIterations_result');
  if (this.success !== null && this.success !== undefined) {
    output.writeFieldBegin('success', Thrift.Type.STRUCT, 0);
    this.success.write(output);
    output.writeFieldEnd();
  }
  if (this.noData !== null && this.noData !== undefined) {
    output.writeFieldBegin('noData', Thrift.Type.STRUCT, 1);
    this.noData.write(output);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

const BrokerClient = function(input, output) {
    this.input = input;
    this.output = (!output) ? input : output;
    this.seqid = 0;
};
BrokerClient.prototype = {};
BrokerClient.prototype.initialize = function(initData, callback) {
  this.send_initialize(initData, callback); 
};

BrokerClient.prototype.send_initialize = function(initData, callback) {
  this.output.writeMessageBegin('initialize', Thrift.MessageType.ONEWAY, this.seqid);
  var params = {
    initData: initData
  };
  var args = new Broker_initialize_args(params);
  args.write(this.output);
  this.output.writeMessageEnd();
  if (callback) {
    this.output.getTransport().flush(true, null);
  } else {
    return this.output.getTransport().flush();
  }
};
BrokerClient.prototype.publishIteration = function(itData, callback) {
  this.send_publishIteration(itData, callback); 
};

BrokerClient.prototype.send_publishIteration = function(itData, callback) {
  this.output.writeMessageBegin('publishIteration', Thrift.MessageType.ONEWAY, this.seqid);
  var params = {
    itData: itData
  };
  var args = new Broker_publishIteration_args(params);
  args.write(this.output);
  this.output.writeMessageEnd();
  if (callback) {
    this.output.getTransport().flush(true, null);
  } else {
    return this.output.getTransport().flush();
  }
};
BrokerClient.prototype.getInitData = function(callback) {
  this.send_getInitData(callback); 
  if (!callback) {
    return this.recv_getInitData();
  }
};

BrokerClient.prototype.send_getInitData = function(callback) {
  this.output.writeMessageBegin('getInitData', Thrift.MessageType.CALL, this.seqid);
  var args = new Broker_getInitData_args();
  args.write(this.output);
  this.output.writeMessageEnd();
  if (callback) {
    var self = this;
    this.output.getTransport().flush(true, function() {
      var result = null;
      try {
        result = self.recv_getInitData();
      } catch (e) {
        result = e;
      }
      callback(result);
    });
  } else {
    return this.output.getTransport().flush();
  }
};

BrokerClient.prototype.recv_getInitData = function() {
  var ret = this.input.readMessageBegin();
  var fname = ret.fname;
  var mtype = ret.mtype;
  var rseqid = ret.rseqid;
  if (mtype == Thrift.MessageType.EXCEPTION) {
    var x = new Thrift.TApplicationException();
    x.read(this.input);
    this.input.readMessageEnd();
    throw x;
  }
  var result = new Broker_getInitData_result();
  result.read(this.input);
  this.input.readMessageEnd();

  if (null !== result.noData) {
    throw result.noData;
  }
  if (null !== result.success) {
    return result.success;
  }
  throw 'getInitData failed: unknown result';
};
BrokerClient.prototype.getIterations = function(callback) {
  this.send_getIterations(callback); 
  if (!callback) {
    return this.recv_getIterations();
  }
};

BrokerClient.prototype.send_getIterations = function(callback) {
  this.output.writeMessageBegin('getIterations', Thrift.MessageType.CALL, this.seqid);
  var args = new Broker_getIterations_args();
  args.write(this.output);
  this.output.writeMessageEnd();
  if (callback) {
    var self = this;
    this.output.getTransport().flush(true, function() {
      var result = null;
      try {
        result = self.recv_getIterations();
      } catch (e) {
        result = e;
      }
      callback(result);
    });
  } else {
    return this.output.getTransport().flush();
  }
};

BrokerClient.prototype.recv_getIterations = function() {
  var ret = this.input.readMessageBegin();
  var fname = ret.fname;
  var mtype = ret.mtype;
  var rseqid = ret.rseqid;
  if (mtype == Thrift.MessageType.EXCEPTION) {
    var x = new Thrift.TApplicationException();
    x.read(this.input);
    this.input.readMessageEnd();
    throw x;
  }
  var result = new Broker_getIterations_result();
  result.read(this.input);
  this.input.readMessageEnd();

  if (null !== result.noData) {
    throw result.noData;
  }
  if (null !== result.success) {
    return result.success;
  }
  throw 'getIterations failed: unknown result';
};

export default BrokerClient;