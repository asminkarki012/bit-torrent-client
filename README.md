# Writing bit torrent client

## Things I Learned

- Working of bit torrent client  
- Managing UDP(dgram in node) and TCP(net.Socket in node) connection socket
- Downloading and assembling files in block
- big-endian byte-ordering system
- Writing and parsing Bit torrent protocol buffers

## Running program

```
npm i
```

```
 tsx src/index.ts <path-to-your-torrent-file>
````

for now default is "torrents/electronics.torrent".Other file might not work as they do not valid tracker url or have not handle other cases.

## Further TODO

- Need to support announce-list ie multiple tracker options
- pausing and resuming the downloads
- Reconnect when connection is dropped
- implement distributed hash tables
- support magnet link
- support upload files
- making simple ui for it
- multiple torrent download

## References

- <http://bittorrent.org/beps/bep_0041.html>
- <https://allenkim67.github.io/programming/2016/05/04/how-to-make-your-own-bittorrent-client.html>
- <https://github.com/nischaldutt/mytorrent-client>
-[Bit torrent specification wiki](https://wiki.theory.org/BitTorrentSpecification#bitfield:_.3Clen.3D0001.2BX.3E.3Cid.3D5.3E.3Cbitfield.3E)
