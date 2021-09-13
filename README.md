zootr-sim-offline - works with 6.0

https://fantatanked.github.io/zootr-sim-offline/

If you load a log and the spawn doesn't give you access to any checks or other areas, you will have to alter the log so that the spawn in an actual region.

E.g. 

 "entrances":                 {
    "Adult Spawn -> Temple of Time": "Kak Shooting Gallery",
    "Child Spawn -> KF Links House": {"region": "Death Mountain", "from": "Kak Behind Gate"}
  },
  
   "entrances":                 {
    "Adult Spawn -> Temple of Time": "Kak Shooting Gallery",
    "Child Spawn -> KF Links House": {"region": "Death Mountain Trail", "from": "Kak Behind Gate"}
  },
  
Death Mountain -> Death Mountain Trail.

Feel free to submit an issue with the location and I can add it into the program so it will recognise it next time it appears.
