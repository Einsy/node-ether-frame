// Copyright (c) 2013, Benjamin J. Kelly ("Author")
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer.
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

'use strict';

module.exports = EtherFrame;

var mac = require('mac-address');

var TYPE_TO_STRING = {
  0x0800: 'ip',
  0x0806: 'arp'
};

var TYPE_FROM_STRING = {
  ip: 0x0800,
  arp: 0x0806
};

function EtherFrame(opts) {
  if (opts instanceof Buffer) {
    return EtherFrame.fromBuffer(opts);
  }

  var self = (this instanceof EtherFrame)
           ? this
           : Object.create(EtherFrame.prototype);

  opts = opts || {};

  self.src = opts.src || mac.ZERO;
  self.dst = opts.dst || mac.ZERO;

  if (opts.type) {
    self.type = opts.type;
    self.typeCode = TYPE_FROM_STRING[self.type];
  } else if (opts.typeCode) {
    self.typeCode = opts.typeCode;
    self.type = TYPE_TO_STRING[self.typeCode];
  } else {
    self.type = 'ip';
    self.typeCode = TYPE_FROM_STRING[self.type];
  }

  if (typeof self.typeCode !== 'number') {
    throw(new Error('Unsupported type [' + self.type + ']'));
  }

  self.length = opts.length || 14;

  if (self.length !== 14) {
    throw new Error('Unsupported ethernet frame length [' + self.length +
                    ']; must be 14 as only most common cases are implemented.');
  }

  return self;
}

EtherFrame.fromBuffer = function(buf, offset) {
  offset = ~~offset;
  var length = 0;

  var dst = mac.toString(buf, offset + length);
  length += mac.LENGTH;

  var src = mac.toString(buf, offset + length);
  length += mac.LENGTH;

  var typeCode = buf.readUInt16BE(offset + length);
  length += 2;

  var type = TYPE_TO_STRING[typeCode];
  if (!type) {
    throw(new Error('Unsupported type code [' + typeCode + ']'));
  }

  return new EtherFrame({ dst: dst, src: src, type: type, typeCode: typeCode,
                          length: length });
};

EtherFrame.prototype.toBuffer = function(buf, offset) {
  offset = ~~offset;
  var buf = (buf instanceof Buffer) ? buf : new Buffer(offset + this.length);

  mac.toBuffer(this.dst, buf, offset);
  offset += mac.LENGTH;

  mac.toBuffer(this.src, buf, offset);
  offset += mac.LENGTH;

  buf.writeUInt16BE(this.typeCode, offset);
  offset += 2;

  return buf;
};
