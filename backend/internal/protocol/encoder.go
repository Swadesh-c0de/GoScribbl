package protocol

import (
	"encoding/binary"
	"sync"
)

// Binary packet format for drawing:
// | byte msgType | byte tool | byte color | byte size | uint16 x1 | uint16 y1 | uint16 x2 | uint16 y2 |
// Total: 12 bytes per stroke segment

const (
	DrawPacketSize = 12
)

var bufferPool = sync.Pool{
	New: func() interface{} {
		return make([]byte, 256)
	},
}

func GetBuffer() []byte {
	return bufferPool.Get().([]byte)
}

func PutBuffer(buf []byte) {
	bufferPool.Put(buf)
}

type DrawPacket struct {
	MsgType   byte
	Tool      byte
	Color     byte
	BrushSize byte
	X1        uint16
	Y1        uint16
	X2        uint16
	Y2        uint16
}

func EncodeDrawPacket(msgType, tool, color, size byte, x1, y1, x2, y2 uint16) []byte {
	buf := make([]byte, DrawPacketSize)
	buf[0] = msgType
	buf[1] = tool
	buf[2] = color
	buf[3] = size

	binary.BigEndian.PutUint16(buf[4:], x1)
	binary.BigEndian.PutUint16(buf[6:], y1)
	binary.BigEndian.PutUint16(buf[8:], x2)
	binary.BigEndian.PutUint16(buf[10:], y2)

	return buf
}

func DecodeDrawPacket(data []byte) *DrawPacket {
	if len(data) < DrawPacketSize {
		return nil
	}

	return &DrawPacket{
		MsgType:   data[0],
		Tool:      data[1],
		Color:     data[2],
		BrushSize: data[3],
		X1:        binary.BigEndian.Uint16(data[4:]),
		Y1:        binary.BigEndian.Uint16(data[6:]),
		X2:        binary.BigEndian.Uint16(data[8:]),
		Y2:        binary.BigEndian.Uint16(data[10:]),
	}
}

// EncodeBatch encodes multiple draw packets into a single message
// Format: | byte msgType (0x03) | uint16 count | ...packets... |
func EncodeBatch(packets [][]byte) []byte {
	if len(packets) == 0 {
		return nil
	}

	totalSize := 3 + len(packets)*DrawPacketSize // 1 byte type + 2 bytes count + packets
	buf := make([]byte, totalSize)
	buf[0] = 0x03 // batch type
	binary.BigEndian.PutUint16(buf[1:], uint16(len(packets)))

	offset := 3
	for _, p := range packets {
		copy(buf[offset:], p)
		offset += len(p)
	}

	return buf
}
