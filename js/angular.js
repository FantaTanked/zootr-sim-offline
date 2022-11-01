var app = angular.module('zootrSim', []);

var child_spawn;
var child_spawn_text;
var adult_spawn;
var adult_spawn_text;

var checked_child_spawn = false;
var checked_adult_spawn = false;

app.filter('removeSpaces', [function() {
  return function(string) {
    if (!angular.isString(string)) {
      return string;
    }
    return string.replace(/[\s]/g, '');
  };
}]);

app.filter('reverseObj', function() {
  return function(items) {
    return Object.keys(items).reverse();
  };
});

app.directive('customOnChange', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var onChangeHandler = scope.$eval(attrs.customOnChange);
      element.on('change', onChangeHandler);
      element.on('$destroy', function() {
        element.off();
      });
    }
  };
});

app.controller('simController', function($scope, $http) {

  $scope.darkModeOn = false;
  
  $scope.init = function() {
    $scope.isShopsanity = false;
    
    $scope.currentSpoilerLog = '';
    
    $scope.checkedHints = [];
    
    $scope.knownHints = {};

    $scope.peekedLocations = [];
    
    $scope.allLocations = {};
    
    $scope.fsHash = [];
    
    $scope.checkedLocations = [];
    
    $scope.currentItemsAll = [];

    $scope.windRegionChild = "";

    $scope.windRegionAdult = "";
    
    $scope.medallions = {};     

    $scope.currentRegion = 'Kokiri Forest';
    $scope.currentAge = 'Child';
    
    $scope.knownMedallions = {
      'Deku Tree': '???',
      'Dodongos Cavern': '???',
      'Jabu Jabus Belly': '???',
      'Forest Temple': '???',
      'Fire Temple': '???',
      'Water Temple': '???',
      'Shadow Temple': '???',
      'Spirit Temple': '???',
      'Free': '???',
    };
    
    $scope.numChecksMade = 0;
    
    $scope.totalChecks = 0;
    
    $scope.gossipHints = {};
    
    $scope.itemCounts = {};
    
    $scope.usedChus = 0;
    
    $scope.collectedWarps = [];
    
    $scope.finished = false;
    
    $scope.route = '';
    
    $scope.currentChild = 1;
    
    $scope.currentAdult = 0;
    
    $scope.playing = false;
    
    $scope.disableUndo = true;
    
    $scope.copying = false;
    
    $scope.shopContents = {};
    
    $scope.actions = [];
  }
  
  $scope.init();

  $scope.currentRegion = 'Goron City';
  
  $scope.getAvailableLocations = function() {
    return $scope.currentAge == 'Child' ? locationsByRegionChild[$scope.currentRegion] : locationsByRegionAdult[$scope.currentRegion];
  }
  
  $scope.getAvailableSkulltulas = function() {   
    return $scope.currentAge == 'Child' ? skulltulasByRegionChild[$scope.currentRegion] : skulltulasByRegionAdult[$scope.currentRegion];
  }
  
  $scope.getAvailableEntrances = function() {
    return $scope.currentAge == 'Child' ? entrancesByRegionChild[$scope.currentRegion] : entrancesByRegionAdult[$scope.currentRegion];
  }
  
  
  $scope.countChus = function() {
    var ownedChus = $scope.currentItemsAll.filter(item => item.includes('Bombchu'));
    return ownedChus.map(item => parseInt(item.substring(item.lastIndexOf('(') + 1, item.lastIndexOf(')')), 10)).reduce((a,b) => a + b, 0);
  };
  
  $scope.useChu = function() {
    $scope.usedChus++;
    $scope.updateForage();
  };
  
  $scope.settingsPresets = {
    'Settings Presets': '',
    'Default / Beginner': 'AJCYTK2AB2FMAA2WCAAAAAK2DUCA',
    'Easy Mode': 'AJYYTKAHT4BAAAJWAACTCTFBJBAAANK2HUCA',
    'Hell Mode (minus Entrance Shuffle)': 'AJB4TT2AA2F9HQG85SAABSBACAAS9BADA33S',
    'Standard Weekly (2020-01-04)': 'AJWGAJARB2BCAAJWAAJBASAGJBHNTHA3EA2UTVAFAA',
    'Accessible Weekly (old) (2019-04-27)': 'AJWYTKAHB2BCAAJWAAJBASAGJBHNTHA3EA2UTVEFAA',
    'S3 Tournament': 'AJWGAJARB2BCAAJWAAJBASAGJBHNTHA3EA2UTVAFAA',
    'Scrub Tournament': 'AJWGAJARB2BCAAJWAACTCTFBJBASAGJBHNTHA3EAEVSVAFAA',
  };
  
  $scope.itemgrid = [
    "Slingshot", "Bomb Bag", "Bow", "Fire Arrows", "Dins Fire", "Zeldas Lullaby", "Minuet of Forest", 
  	"Progressive Wallet", "Boomerang", "Progressive Hookshot", "Light Arrows", "Farores Wind", "Eponas Song", "Bolero of Fire", 
  	"Bottle", "Lens of Truth", "Megaton Hammer", "Magic Meter", "Nayrus Love", "Sarias Song", "Serenade of Water", 
  	"Kokiri Sword", "Ocarina", "Iron Boots", "Progressive Strength Upgrade", "Stone of Agony", "Suns Song", "Requiem of Spirit", 
  	"Goron Tunic", "Zora Tunic", "Hover Boots", "Progressive Scale", "Child Trade", "Song of Time", "Nocturne of Shadow",
  	"Deku Shield", "Hylian Shield", "Mirror Shield", "Bombchus", "Adult Trade", "Song of Storms", "Prelude of Light", 
  ];
  
  $scope.buildRoute = function() {
    return $scope.route.replace(/(?:\r\n|\r|\n)/g, '<br/>');
  };
  
  $scope.checkLocation = function(loc) {
    $scope.actions.push('Location:' + loc);
    if (loc.startsWith('Check Pedestal')) {
      $scope.checkedLocations.push(loc);
      if ($scope.currentAge == 'Adult') {
        $scope.checkedLocations.push('Check Pedestal (Stones)');
      }
      for (var key in $scope.medallions) {
        if (!$scope.currentItemsAll.includes($scope.medallions[key])) {
          if ($scope.medallions[key].includes('Medallion')) {
            if ($scope.currentAge == 'Adult') {
              $scope.knownMedallions[key] = $scope.medallions[key];
            }
          }
          else {
            $scope.knownMedallions[key] = $scope.medallions[key];
          }
        }
      }
    }
    else if (loc == 'Light Arrows Hint') {
      $scope.checkedLocations.push(loc);
      var lightlocation = Object.keys($scope.allLocations).find(key => $scope.allLocations[key] === 'Light Arrows');
      var lighthint = Object.keys(locationsByRegionAdult).find(key => locationsByRegionAdult[key].includes(lightlocation));
      if (typeof lighthint == 'undefined') {
        lighthint = Object.keys(locationsByRegionChild).find(key => locationsByRegionChild[key].includes(lightlocation));
      }
      if (!(lighthint in $scope.knownHints)) {
        $scope.knownHints[lighthint] = ['Light Arrows'];
      }
      else {
        $scope.knownHints[lighthint].push('Light Arrows');
      }
      $scope.lastchecked = 'Ha ha ha... You\'ll never beat me by reflecting my lightning bolts and unleashing the arrows from '+lighthint+'!';
      $scope.route += 'Light Arrows Hint ('+lighthint+')\n';
    }
    else if (loc == 'Ganon') {
      if (false && !$scope.currentItemsAll.includes('Light Arrows')) {
        $scope.actions.pop();
        $scope.lastchecked = 'Not without Light Arrows!';
      }
      else {
        $scope.finished = true;
        $scope.route += 'Ganon\n';
      }
    }
    else if (!(loc in $scope.allLocations) && loc.startsWith('GS ')) {
      $scope.currentItemsAll.push('Gold Skulltula Token');
      $scope.itemCounts['Gold Skulltula Token']++;
      $scope.checkedLocations.push(loc);
    }

    else {
      $scope.numChecksMade++;
      
      $scope.checkedLocations.push(loc);
      var item = $scope.allLocations[loc];
      if (item.includes('[Costs')) {
        item = item.split('[Costs')[0].trim();
      }
      $scope.currentItemsAll.push(item);
      $scope.route += loc + (importantItems.includes(item) ? ' ('+item+')' : '') + '\n';
      $scope.lastchecked = loc + ': ' + item;
      $scope.itemCounts[item]++;
      
      if (loc in bosses) {
        $scope.knownMedallions[bosses[loc]] = item;
      }
      
      if (loc in regionChangingChecks) {
        $scope.currentRegion = regionChangingChecks[loc];
      }
      
      if (warpSongs.includes(item)) {
        $scope.collectedWarps.push(item);
      }
    }

    $scope.updateForage();
  };
  
  $scope.hasKeys = function(dungeon) {
  return dungeon in {
    'Forest Temple':0,
    'Fire Temple':0,
    'Water Temple':0,
    'Shadow Temple':0,
    'Spirit Temple':0,
    'Spirit Temple':0,
    'Bottom of the Well':0,
    'Gerudo Fortress':0,
    'Gerudo Training Ground':0,
    'Ganons Castle':0
  };
};

$scope.peekAt = function(loc) {
  var hintItem = $scope.allLocations[loc];
  if (!(loc in $scope.knownHints)) {
    $scope.knownHints[loc] = [hintItem];
  }
  else {
    $scope.knownHints[loc].push(hintItem);
  }
  $scope.peekedLocations.push(loc);
  $scope.lastchecked = loc + ": " + hintItem;
  $scope.actions.push("Peek:" + loc);
  $scope.updateForage();
};

$scope.hasPeeked = function(loc) {
  return $scope.peekedLocations.includes(loc);
};

$scope.undoCheck = function() {
  var mostRecent = $scope.actions.pop();
  if (mostRecent.split(':')[0] == 'Location') {
    $scope.numChecksMade--;
    var lastCheckedLocation = mostRecent.split(':')[1];
    $scope.checkedLocations.pop();
    if (lastCheckedLocation in $scope.allLocations) {
      $scope.currentItemsAll.splice($scope.currentItemsAll.lastIndexOf($scope.allLocations[lastCheckedLocation]));
      $scope.numChecksMade--;
      
      $scope.itemCounts[$scope.allLocations[lastCheckedLocation]]--;
      if(warpSongs.includes($scope.allLocations[lastCheckedLocation])) {
        $scope.collectedWarps.pop();
      }
      if (lastCheckedLocation in bosses) {
        $scope.currentRegion = bosses[lastCheckedLocation];
        if (!$scope.checkedLocations.includes('Check Pedestal (Medallions)')) {
          if (!$scope.checkedLocations.includes('Check Pedestal (Stones)') || !($scope.allLocations[lastCheckedLocation] == 'Kokiri Emerald' || $scope.allLocations[lastCheckedLocation] == 'Goron Ruby' || $scope.allLocations[lastCheckedLocation] == 'Zora Sapphire')) {
            $scope.knownMedallions[bosses[lastCheckedLocation]] = '???';
          }
        }
      }
      if (lastCheckedLocation == 'Impa at Castle') {
        $scope.currentRegion = 'Hyrule Castle';
      }
    }
    else if (lastCheckedLocation.startsWith('GS ')) {
      $scope.currentItemsAll.splice($scope.currentItemsAll.lastIndexOf('Gold Skulltula Token'));
      $scope.itemCounts['Gold Skulltula Token']--;
    }
    else if (lastCheckedLocation == 'Check Pedestal (Stones)') {
      if (!$scope.checkedLocations.includes('Check Pedestal (Medallions)')) {
        for (loc in $scope.knownMedallions) {
          var med = $scope.knownMedallions[loc];
          if (!$scope.currentItemsAll.includes(med) && (med == 'Kokiri Emerald' || med == 'Goron Ruby' || med == 'Zora Sapphire')) {
            $scope.knownMedallions[loc] = '???';
          }
        }
      }
    }
    else if (lastCheckedLocation == 'Check Pedestal (Medallions)') {
      $scope.checkedLocations.pop();
      for (loc in $scope.knownMedallions) {
        var med = $scope.knownMedallions[loc];
        if ($scope.checkedLocations.includes('Check Pedestal (Stones)') && (med == 'Kokiri Emerald' || med == 'Goron Ruby' || med == 'Zora Sapphire')) {
          continue;
        }
        if (!$scope.currentItemsAll.includes(med)) {
          $scope.knownMedallions[loc] = '???';
        }
      }
    }
  }
  else if (mostRecent.split(':')[0] == 'Entrance') {
    if (mostRecent.split(':')[2] == 'Pull Master Sword') {
      $scope.currentAge = 'Child';
      $scope.currentAdult--;
    }
    else if (mostRecent.split(':')[2] == 'Place Master Sword') {
      $scope.currentAge = 'Adult';
      $scope.currentChild--;
    }
    else if (mostRecent.split(':')[1] == 'Kokiri Forest' && mostRecent.split(':')[2] == 'Hyrule Field' && !$scope.actions.includes(mostRecent) && $scope.checkedLocations.includes('Gift from Saria')) {
      $scope.checkedLocations.splice($scope.checkedLocations.lastIndexOf('Gift from Saria'));
      var item = '';
      if ('Gift from Saria' in $scope.allLocations) {
        item = $scope.allLocations['Gift from Saria'];
      }
      else {
        item = 'Ocarina';
      }
      $scope.itemCounts[item]--;
      $scope.numChecksMade--;
      if(warpSongs.includes(item)) {
        $scope.collectedWarps.pop();
      }
    }
    $scope.currentRegion = mostRecent.split(':')[1];
  }
  else if (mostRecent.split(':')[0] == 'Hint') {
    $scope.checkedHints.pop();
    $scope.knownHints[mostRecent.split(':')[2]].pop();
    if ($scope.knownHints[mostRecent.split(':')[2]].length == 0) {
      delete $scope.knownHints[mostRecent.split(':')[2]];
    }
  }
  
  else if (mostRecent.split(':')[0] == 'Buy') {
    $scope.shopContents[mostRecent.split(':')[1]][mostRecent.split(':')[2]].bought = false;
    var item = $scope.shopContents[mostRecent.split(':')[1]][mostRecent.split(':')[2]].item;
    if (!$scope.shopContents[mostRecent.split(':')[1]][mostRecent.split(':')[2]].refill) {
      $scope.checkedLocations.pop();
      $scope.numChecksMade--;
      if(warpSongs.includes(item)) {
        $scope.collectedWarps.pop();
      }
    }
    $scope.currentItemsAll.pop();
    $scope.itemCounts[item]--;
  }

  else if (mostRecent.split(':')[0] == 'Peek') {
    $scope.peekedLocations.pop();
    $scope.knownHints[mostRecent.split(':')[1]].pop();
    if ($scope.knownHints[mostRecent.split(':')[1]].length == 0) {
      delete $scope.knownHints[mostRecent.split(':')[1]];
    }
  }
  
  $scope.updateForage();
  
  return;
  if ($scope.checkedLocations.length >= 2) {
    var lastCheckedLocation = $scope.checkedLocations.pop();
    if (lastCheckedLocation in $scope.allLocations) {
      $scope.currentItemsAll.splice($scope.currentItemsAll.lastIndexOf($scope.allLocations[lastCheckedLocation]));
      $scope.numChecksMade--;
      
      $scope.itemCounts[$scope.allLocations[lastCheckedLocation]]--;
    }
    else if (lastCheckedLocation.startsWith('GS ')) {
      $scope.currentItemsAll.splice($scope.currentItemsAll.lastIndexOf('Gold Skulltula Token'));
      $scope.itemCounts['Gold Skulltula Token']--;
    }
    else if (lastCheckedLocation.includes('shopitem')) {
      var shop = lastCheckedLocation.split('|')[1];
      var index = parseInt(lastCheckedLocation.split('|')[2]);
      $scope.shopContents[shop][index].bought = false;
      $scope.currentItemsAll.splice($scope.currentItemsAll.lastIndexOf($scope.shopContents[shop][index].item));
      $scope.numChecksMade--;
      $scope.itemCounts[$scope.shopContents[shop][index].item]--;
    }
    if ($scope.checkedLocations.length < 2) {
      $scope.disableUndo = true;
    }
    //$scope.route = $scope.route.substring(0, $scope.route.lastIndexOf('\n'));
  }
  $scope.updateForage()
};

$scope.copyRoute = function() {
  if (!$scope.copying) {
    $scope.copying = true;
    new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve();
      }, 1000);
    }).then(function() {
      $scope.copying = false;
      $scope.$apply();
    });
  }
  window.getSelection().selectAllChildren(document.getElementsByClassName('route')[0]);
  document.execCommand('copy');
  document.getSelection().removeAllRanges();
};

$scope.saveRoute = function() {
  var blob = new Blob([$scope.route.replace(/(?:\r\n|\r|\n)/g, '\r\n')], {type: "text/plain;charset=utf-8"});
  window.saveAs(blob, $scope.currentSeed + "-route.txt");
};

$scope.hasBossKey = function(dungeon) {
  return dungeon in {
    'Forest Temple':0,
    'Fire Temple':0,
    'Water Temple':0,
    'Shadow Temple':0,
    'Spirit Temple':0,
    'Spirit Temple':0,
    'Ganons Castle':0
  };
};
  
  $scope.takeEntrance = function(entrance) {
    $scope.actions.push('Entrance:' + $scope.currentRegion + ':' + entrance);
    if (entrance == 'Pull Master Sword') {
      $scope.currentAdult++;
      $scope.route += '\n---- ADULT ' + $scope.currentAdult + ' ----\n\n';
      $scope.currentAge = 'Adult';
    }
    else if (entrance == 'Place Master Sword') {
      $scope.currentChild++;
      $scope.route += '\n---- CHILD ' + $scope.currentChild + ' ----\n\n';
      $scope.currentAge = 'Child';
    }
    else if (entrance == 'Savewarp Child') {
      $scope.currentRegion = getSpawn($scope['currentSpoilerLog']['entrances']['Child Spawn -> KF Links House']['region'] === undefined ? $scope['currentSpoilerLog']['entrances']['Child Spawn -> KF Links House'] : $scope['currentSpoilerLog']['entrances']['Child Spawn -> KF Links House']['region']);
      $scope.child_spawn_text = $scope['currentSpoilerLog']['entrances']['Child Spawn -> KF Links House']['region'] === undefined ? $scope['currentSpoilerLog']['entrances']['Child Spawn -> KF Links House'] : $scope['currentSpoilerLog']['entrances']['Child Spawn -> KF Links House']['region'];
      checked_child_spawn = true;
      $scope.route += 'Savewarp\n';
    }
    else if (entrance == 'Savewarp Adult') {
      $scope.currentRegion = getSpawn($scope['currentSpoilerLog']['entrances']['Adult Spawn -> Temple of Time']['region'] === undefined ? $scope['currentSpoilerLog']['entrances']['Adult Spawn -> Temple of Time'] : $scope['currentSpoilerLog']['entrances']['Adult Spawn -> Temple of Time']['region']);
      $scope.adult_spawn_text = $scope['currentSpoilerLog']['entrances']['Adult Spawn -> Temple of Time']['region'] === undefined ? $scope['currentSpoilerLog']['entrances']['Adult Spawn -> Temple of Time'] : $scope['currentSpoilerLog']['entrances']['Adult Spawn -> Temple of Time']['region'];
      checked_adult_spawn = true;
      $scope.route += 'Savewarp\n';
    }
    else if (entrance in songTargets) {
      $scope.currentRegion = songTargets[entrance];
      $scope.route += 'Play ' + entrance + '\n';
    }
    else if ($scope.currentRegion == 'Kokiri Forest' && entrance == 'Hyrule Field' && $scope.currentAge == 'Child' && !$scope.checkedLocations.includes('Gift from Saria')) {
      $scope.checkedLocations.push('Gift from Saria');
      var item = '';
      if ('Gift from Saria' in $scope.allLocations) {
        item = $scope.allLocations['Gift from Saria'];
      }
      else {
        item = 'Ocarina';
      }
      $scope.currentItemsAll.push(item);
      $scope.numChecksMade++;
      $scope.itemCounts[item]++;
      if($scope.checkedLocations.length >= 2) {
        $scope.disableUndo = false;
      }
      $scope.route += 'Gift from Saria' + (importantItems.includes(item) ? ' ('+item+')' : '') + '\n';
      $scope.lastchecked = 'Gift from Saria: ' + item;
      $scope.currentRegion = entrance;
    }
    else {
      $scope.currentRegion = entrance;
    }
    $scope.updateForage();
  };
  
  $scope.dungeongrid = [
    'Deku Tree', 
    'Dodongos Cavern', 
    'Jabu Jabus Belly', 
    'Forest Temple', 
    'Fire Temple', 
    'Water Temple', 
    'Shadow Temple', 
    'Spirit Temple', 
    'Free',
    'Bottom of the Well', 
    'Gerudo Fortress', 
    'Gerudo Training Ground', 
    'Ganons Castle' 
  ];
  
  $scope.getMedallionImage = function(dungeon) {
    if (dungeon in $scope.knownMedallions) {
      med = $scope.knownMedallions[dungeon];
      var medToImage = {
        'Kokiri Emerald': 'stones.png',
        'Goron Ruby': 'stones.png',
        'Zora Sapphire': 'stones.png',
        'Forest Medallion': 'forest-small.png',
        'Fire Medallion': 'firewater.png',
        'Water Medallion': 'firewater.png',
        'Shadow Medallion': 'shadowspirit.png',
        'Spirit Medallion': 'shadowspirit.png',
        'Light Medallion': 'light-small.png',
        '???': 'unknown-small.png' 
      };
      return medToImage[med];
    }
    else {
      return '';
    }
  };
  
  $scope.nameToImageTitle = {
    'Deku Tree': 'deku.png',
    'Dodongos Cavern': 'dodongo.png',
    'Jabu Jabus Belly': 'jabu.png',
    'Forest Temple': 'forest.png',
    'Fire Temple': 'fire.png',
    'Water Temple': 'water.png',
    'Shadow Temple': 'shadow.png',
    'Spirit Temple': 'spirit.png',
    'Free': 'free.png',
    'Spirit Temple': 'spirit.png',
    'Bottom of the Well': 'botw.png',
    'Ice Cavern': 'ice.png',
    'Gerudo Fortress': 'gf.png',
    'Gerudo Training Ground': 'gtg.png',
    'Ganons Castle': 'gc.png'
  }
  
  $scope.shouldAppearInLocations = function(loc) {
    return loc in $scope.allLocations || inSpoilerExceptions.includes(loc);
  }
  
  $scope.getImage = function(item, count) {
    if (item == 'Bottle') {
      var bottles = 0;
      var hasLetter = false;
      for (var i = 0; i < $scope.currentItemsAll.length; i++) {
        if ($scope.currentItemsAll[i].startsWith('Bottle') || $scope.currentItemsAll[i].startsWith('Rutos')) {
          bottles++;
          if ($scope.currentItemsAll[i] == 'Rutos Letter') {
            hasLetter = true;
          }
        }
      }
      return [(hasLetter ? 'ruto' : '') + 'bottle' + bottles + '.png', bottles > 0]
    }
    else if (item == 'Child Trade') {
      retval = [];
      if ($.inArray('Weird Egg', $scope.currentItemsAll) == -1) {
        return ['egg.png', false];
      }
      if ($.inArray('Weird Egg', $scope.currentItemsAll) != -1) {
        retval = ['egg.png', true];
      }
      if ($.inArray('Chicken', $scope.currentItemsAll) != -1) {
        retval = ['cucco.png', true];
      }
      if ($.inArray('Zeldas Letter', $scope.currentItemsAll) != -1) {
        retval = ['letter.png', true];
      }
      if ($.inArray('Keaton Mask', $scope.currentItemsAll) != -1) {
        retval = ['keaton.png', true];
      }
      if ($.inArray('Skull Mask', $scope.currentItemsAll) != -1) {
        retval = ['skull.png', true];
      }
      if ($.inArray('Spooky Mask', $scope.currentItemsAll) != -1) {
        retval = ['spooky.png', true];
      }
      if ($.inArray('Bunny Hood', $scope.currentItemsAll) != -1) {
        retval = ['bunny.png', true];
      }
      if ($.inArray('Mask of Truth', $scope.currentItemsAll) != -1) {
        retval = ['truth.png', true];
      }
      return retval;
    }
    else if (item == 'Adult Trade') {
      if ($.inArray('Claim Check', $scope.currentItemsAll) != -1) {
        return ['claim.png', true];
      }
      if ($.inArray('Eyedrops', $scope.currentItemsAll) != -1) {
        return ['eyedrops.png', true];
      }
      if ($.inArray('Eyeball Frog', $scope.currentItemsAll) != -1) {
        return ['frog.png', true];
      }
      if ($.inArray('Prescription', $scope.currentItemsAll) != -1) {
        return ['prescription.png', true];
      }
      if ($.inArray('Broken Sword', $scope.currentItemsAll) != -1) {
        return ['broken_sword.png', true];
      }
      if ($.inArray('Poachers Saw', $scope.currentItemsAll) != -1) {
        return ['saw.png', true];
      }
      if ($.inArray('Odd Mushroom', $scope.currentItemsAll) != -1) {
        return ['mushroom.png', true];
      }
      if ($.inArray('Cojiro', $scope.currentItemsAll) != -1) {
        return ['cojiro.png', true];
      }
      if ($.inArray('Pocket Cucco', $scope.currentItemsAll) != -1) {
        return ['cucco.png', true];
      }
      if ($.inArray('Pocket Egg', $scope.currentItemsAll) != -1) {
        return ['egg.png', true];
      }
      else {
        return ['egg.png', false];
      }
    }
    else if (item == 'Gold Skulltulas') {
      return ['skulltula.png', false];
    }
    else if (item == 'Progressive Wallet' && !$scope.isShopsanity && count == 2) {
      return ['wallet2.png', true];
    }
    else {
      if (count >= $scope.codeToImage[item].length) {
        return [$scope.codeToImage[item][$scope.codeToImage[item].length - 1], count > 0];
      }
      else {
        return [$scope.codeToImage[item][count], count > 0];
      }
    }
  }
  
  $scope.throwAway = function(item) {
    $scope.init();
    $scope.updateForage();
  };
  
  $scope.countItem = function(item) {
    return 0;
  };

  $scope.setWind = function() {
    if ($scope.currentAge == "Child") {
      $scope.windRegionChild = $scope.currentRegion;
    }
    else {
      $scope.windRegionAdult = $scope.currentRegion;
    }
    $scope.updateForage();
  };

  $scope.recallWind = function() {
    if ($scope.currentAge == "Child") {
      $scope.currentRegion = $scope.windRegionChild;
      $scope.windRegionChild = "";
    }
    else {
      $scope.currentRegion = $scope.windRegionAdult;
      $scope.windRegionAdult = "";
    }
    $scope.updateForage();
  };
  
  $scope.downloadSpoilerLog = function() {
    var blob = new Blob([JSON.stringify($scope.currentSpoilerLog, null, '\t')], {type: "application/json"});
    window.saveAs(blob, $scope.currentSeed + "-spoiler.json");
  };
  
  $scope.codeToImage = {
    'Ocarina': ['fairyocarina.png', 'fairyocarina.png', 'ocarina.png'],
    'Slingshot': ['slingshot.png', 'sling3.png', 'sling4.png', 'sling5.png'],
    'Bomb Bag': ['bomb.png', 'bomb2.png', 'bomb3.png', 'bomb4.png'],
    'Bow': ['bow.png', 'bow3.png', 'bow4.png', 'bow5.png'],
    'Fire Arrows': ['firearrow.png', 'firearrow.png'],
    'Dins Fire': ['din.png', 'din.png'],
    'Zeldas Lullaby': ['zelda.png', 'zelda.png'],
    'Minuet of Forest': ['green_note.png', 'green_note.png'],
    'Progressive Wallet': ['wallet.png', 'wallet1.png', 'wallet2a.png', 'wallet3.png'],
    'Boomerang': ['boomerang.png', 'boomerang.png'],
    'Progressive Hookshot': ['hookshotd.png', 'hookshot.png', 'longshot.png'],
    'Light Arrows': ['lightarrow.png', 'lightarrow.png'],
    'Farores Wind': ['farore.png', 'farore.png'],
    'Eponas Song': ['epona.png', 'epona.png'],
    'Bolero of Fire': ['red_note.png', 'red_note.png'],
    'Lens of Truth': ['lens.png', 'lens.png'],
    'Megaton Hammer': ['hammer.png', 'hammer.png'],
    'Magic Meter': ['magic.png', 'magic.png', 'magic2.png'],
    'Nayrus Love': ['nayru.png', 'nayru.png'],
    'Sarias Song': ['saria.png', 'saria.png'],
    'Serenade of Water': ['blue_note.png', 'blue_note.png'],
    'Kokiri Sword': ['sword1.png', 'sword1.png'],
    'Biggoron Sword': ['sword3.png', 'sword3.png'],
    'Iron Boots': ['ironboots.png', 'ironboots.png'],
    'Progressive Strength Upgrade': ['lift1.png', 'lift1.png', 'lift2.png', 'lift3.png'],
    'Stone of Agony': ['agony.png', 'agony.png'],
    'Suns Song': ['sunsong.png', 'sunsong.png'],
    'Requiem of Spirit': ['orange_note.png', 'orange_note.png'],
    'Goron Tunic': ['redtunic.png', 'redtunic.png'],
    'Zora Tunic': ['besttunic.png', 'besttunic.png'],
    'Hover Boots': ['hoverboots.png', 'hoverboots.png'],
    'Progressive Scale': ['scale1.png', 'scale1.png', 'scale2.png'],
    'Song of Time': ['songoftime.png', 'songoftime.png'],
    'Nocturne of Shadow': ['purple_note.png', 'purple_note.png'],
    'Deku Shield': ['shield1.png', 'shield1.png', 'shield1.png', 'shield1.png', 'shield1.png'],
    'Hylian Shield': ['shield2.png', 'shield2.png', 'shield2.png', 'shield2.png'],
    'Mirror Shield': ['shield3.png', 'shield3.png'],
    'Bombchus': ['bombchu.png', 'bombchu.png'],
    'Song of Storms': ['songofstorms.png', 'songofstorms.png'],
    'Prelude of Light': ['yellow_note.png', 'yellow_note.png']
  };
  
  $scope.settingsPreset = '';
  
  $scope.result = '';
  
  $scope.hashImages = {
    'Deku Stick': 'stick.png',
    'Deku Nut': 'nut.png',
    'Bow': 'bow.png',
    'Slingshot': 'slingshot.png',
    'Fairy Ocarina': 'fairyocarina.png',
    'Bombchu': 'bombchu.png',
    'Longshot': 'longshot.png',
    'Boomerang': 'boomerang.png',
    'Lens of Truth': 'lens.png',
    'Beans': 'bean.png',
    'Megaton Hammer': 'hammer.png',
    'Bottled Fish': 'fish.png',
    'Bottled Milk': 'milk.png',
    'Mask of Truth': 'truth.png',
    'SOLD OUT': 'soldout.png',
    'Cucco': 'cucco.png',
    'Mushroom': 'mushroom.png',
    'Saw': 'saw.png',
    'Frog': 'frog.png',
    'Master Sword': 'sword2.png',
    'Mirror Shield': 'shield3.png',
    'Kokiri Tunic': 'greentunic.png',
    'Hover Boots': 'hoverboots.png',
    'Silver Gauntlets': 'lift2.png',
    'Gold Scale': 'scale2.png',
    'Stone of Agony': 'agony.png',
    'Skull Token': 'skulltula.png',
    'Heart Container': 'heartcontainer.png',
    'Boss Key': 'boss_key.png',
    'Compass': 'compass.png',
    'Map': 'map.png',
    'Big Magic': 'magic2.png',
  };
  
  $scope.toggleDarkMode = function() {
    $scope.darkModeOn = !$scope.darkModeOn;
    localforage.setItem('darkModeOn', $scope.darkModeOn);
  };
  
  $scope.presetSelected = function() {
    $scope.settingsString = $scope.settingsPreset;
  };
  
  $scope.currentShop = function() {
    if ($scope.currentRegion == 'Kokiri Forest') {
      return 'Kokiri Shop';
    }
    else if ($scope.currentRegion == 'Market') {
      if ($scope.currentOtherShop == 'Castle Town Potion Shop' || $scope.currentOtherShop == 'Bombchu Shop') {
        return $scope.currentOtherShop;
      }
      else {
        return 'Castle Town Bazaar';
      }
    }
    else if ($scope.currentRegion == 'Kakariko Village') {
      if ($scope.currentOtherShop == 'Kakariko Potion Shop') {
        return $scope.currentOtherShop;
      }
      else {
        return 'Kakariko Bazaar';
      }
    }
    else if ($scope.currentRegion == 'Goron City') {
      return 'Goron Shop';
    }
    else if ($scope.currentRegion == 'Zoras Domain') {
      return 'Zora Shop';
    }
    else {
      return '';
    }
  }
  
  $scope.currentOtherShop = '';
  
  $scope.otherShops = function() {
    if ($scope.currentRegion == 'Market') {
      if ($scope.currentOtherShop == 'Castle Town Potion Shop') {
        return ['Castle Town Bazaar', 'Bombchu Shop'];
      }
      else if ($scope.currentOtherShop == 'Bombchu Shop') {
        return ['Castle Town Bazaar', 'Castle Town Potion Shop'];
      }
      else {
        return ['Castle Town Potion Shop', 'Bombchu Shop'];
      }
    }
    else if ($scope.currentRegion == 'Kakariko Village') {
      if ($scope.currentOtherShop == 'Kakariko Potion Shop') {
        return ['Kakariko Bazaar'];
      }
      else {
        return ['Kakariko Potion Shop'];
      }
    }
    else {
      return [];
    }
  };
  
  $scope.setShop = function(shop) {
    if (shop == 'Kakariko Bazaar' || shop == 'Castle Town Bazaar') {
      $scope.currentOtherShop = '';
    }
    else {
      $scope.currentOtherShop = shop;
    }
  };
  
  $scope.fetchSeed = function() {
    if ($scope.generating) {
      return;
    }
    $scope.generating = true;
    $scope.generationError = null;
    var url = '/zootr-sim/getspoiler?valid=true&settings='+$scope.settingsString+'&seed='+($scope.seed || '');
    $http({
      method: 'GET',
      url: url
    }).then(function successCallback(response) {
      $scope.generating = false;
      if (response.data[':version'] == ('6.0.0 Release')) {
        $scope.currentSpoilerLog = response.data;
        $scope.parseLog(response.data);
      }
      else {
        if (response.data.includes('settings_string') || response.data.includes('Invalid randomizer settings')) {
          $scope.generationError = "Error! Invalid settings string! Note that multiworld isn't supported by the API endpoint.";
        }
        else if (response.data.includes('Game unbeatable')) {
          $scope.generationError = "Error! Game unbeatable! Try again with a different seed."
        }
        else if (response.data.includes('You may only generate a seed once every 5 seconds')) {
          $scope.generationError = "Error! Too many seeds being generated. Try again in 5 seconds.";
        }
        else if (response.data.includes('502 Bad Gateway')) {
          $scope.generationError = "Error! 502 Bad Gateway response from ootrandomizer.com.";
        }
        else {
          $scope.generationError = "Unknown Error (please report this!): " + response.data;
        }
      }
    }, function errorCallback(response) {
      $scope.generationError = response;
    });
  };
  
  $scope.fileSelected = function(event) {
    reader = new FileReader();
    reader.onload = function(e) {
      $scope.parseLog(e.target.result);
      $scope.$apply();
    }
    reader.readAsText(event.target.files[0]);
  }
  
  $scope.checkHint = function(stone) {    
    var hint = '';
    if (stone == 'Generic Grotto') {
      hint = $scope.gossipHints[stone];
      $scope.checkedHints.push(stone);
    }
    else {
      hint = $scope.gossipHints[$scope.currentRegion][stone];
      $scope.checkedHints.push($scope.currentRegion + ' ' + stone);
    }
    
    var hintInfo = parseHint(hint);    
    var hintLoc = hintInfo[0];
    var hintItem = hintInfo[1];
    
    $scope.actions.push('Hint:' + stone + ':' + hintLoc);
    
    if (hintLoc.includes("/")) {
      hintLoc = hintLoc.split("/")[0] in $scope.allLocations ? hintLoc.split("/")[0] : hintLoc.split("/")[1];
    }
    
    if (hintLoc != '' && hintItem != '') {
      if (!(hintLoc in $scope.knownHints)) {
        $scope.knownHints[hintLoc] = [hintItem];
      }
      else {
        $scope.knownHints[hintLoc].push(hintItem);
      }
    }
    
    $scope.lastchecked = hint;
    $scope.updateForage();
  };
  
  $scope.playing = false;

  $scope.parseLog = function(logfile) {
    if (typeof logfile == 'string') {
      logfile = JSON.parse(logfile);
    }

    if (logfile['entrances'] === undefined) logfile['entrances'] = {};
    if (logfile['entrances']['Child Spawn -> KF Links House'] === undefined){
      logfile['entrances']['Child Spawn -> KF Links House'] = defaultSpawns['Child'];
      checked_child_spawn = true;
    }
    if (logfile['entrances']['Adult Spawn -> Temple of Time'] === undefined){
      logfile['entrances']['Adult Spawn -> Temple of Time'] = defaultSpawns['Adult'];
      checked_adult_spawn = true;
    }

    $scope.currentSpoilerLog = logfile;
    //if (logfile['settings']['entrance_shuffle'] != "off") {
    //  alert("Error! Entrance shuffle is not supported.");
    //  return;
    //}
    // else if (logfile['settings']['world_count'] != 1) {
    //   alert("Error! Multiworld is not supported.");
    //   return;
    // }

    child_spawn = logfile['entrances']['Child Spawn -> KF Links House']['region'];
    adult_spawn = logfile['entrances']['Adult Spawn -> Temple of Time']['region'];   

    var spawn_age = logfile['randomized_settings']['starting_age'];

    checked_child_spawn = spawn_age == 'child' ? true : checked_child_spawn;
    checked_adult_spawn = spawn_age == 'adult' ? true : checked_adult_spawn;

    try {
      $scope.currentSeed = logfile[':seed'];

      var childRegion = logfile['entrances']['Child Spawn -> KF Links House']['region'] === undefined ? logfile['entrances']['Child Spawn -> KF Links House'] : logfile['entrances']['Child Spawn -> KF Links House']['region'];
      var childRegionText = logfile['entrances']['Child Spawn -> KF Links House']['region'] === undefined ? logfile['entrances']['Child Spawn -> KF Links House'] : logfile['entrances']['Child Spawn -> KF Links House']['region'];

      childRegion = getSpawn(childRegion)

      $scope.child_spawn = childRegion;
      child_spawn = childRegion;
      $scope.child_spawn_text = (logfile['randomized_settings']['starting_age'] == 'child' || checked_child_spawn) ? childRegionText : '???';
      child_spawn_text = childRegionText;

      var adultRegion = logfile['entrances']['Adult Spawn -> Temple of Time']['region'] === undefined ? logfile['entrances']['Adult Spawn -> Temple of Time'] : logfile['entrances']['Adult Spawn -> Temple of Time']['region'];
      var adultRegionText = logfile['entrances']['Adult Spawn -> Temple of Time']['region'] === undefined ? logfile['entrances']['Adult Spawn -> Temple of Time'] : logfile['entrances']['Adult Spawn -> Temple of Time']['region'];
      adultRegion = getSpawn(adultRegion)

      $scope.adult_spawn = adultRegion;
      adult_spawn = adultRegion;
      adult_spawn_text = adultRegionText;
      //$scope.adult_spawn_text = logfile['randomized_settings']['starting_age'] == 'adult' ? logfile['entrances']['Adult Spawn -> Temple of Time']['region'] : '???';
      $scope.adult_spawn_text = (logfile['randomized_settings']['starting_age'] == 'adult' || checked_adult_spawn) ? adultRegionText : '???';
      var results = logfile['locations'];
      $scope.fsHash = logfile['file_hash'];
      $scope.isShopsanity = logfile['settings']['shopsanity'] != 'off';
      $scope.totalChecks = results.length;
      for (var loc in results) {
        item = typeof results[loc] == 'object' ? results[loc]['item'] : results[loc];
        var shop = getShop(loc);
        if (shop != '') {
          var cost = results[loc]['price'];
          if (!(shop in $scope.shopContents)) {
            $scope.shopContents[shop] = [];
          }
          var shopItem = {};
          var refill = item.includes('Buy');
          shopItem['item'] = refill ? item.split('Buy')[1].trim() : item;
          shopItem['item'] = shopItem['item'].split('[')[0].trim();
          shopItem['cost'] = cost;
          shopItem['refill'] = refill;
          shopItem['bought'] = false;
          $scope.shopContents[shop].push(shopItem);
        }        
        $scope.allLocations[loc] = item;
        $scope.itemCounts[item] = 0;
      }

      if (!('Kokiri Sword Chest' in $scope.allLocations)) {
        $scope.allLocations['Kokiri Sword Chest'] = 'Kokiri Sword';
      }
      if (logfile['settings']['start_with_deku_equipment']) {
        $scope.itemCounts['Deku Shield'] = 1;
      }
      $scope.itemCounts['Ocarina'] = 0;
      $scope.itemCounts['Bombchus'] = 0;
      $scope.itemCounts['Gold Skulltula Token'] = 0;
      $scope.itemCounts['Kokiri Sword'] = 0;
      $scope.itemCounts['Nayrus Love'] = 0;
      for (var item in logfile['starting_items']) {
        $scope.itemCounts[item] = logfile['starting_items'][item];
      }
      for (var hint in logfile['gossip_stones']) {
        region = hint.split('(')[0].trim();
        if (region == 'Zoras River') region = 'Zora River';
        if (region == 'Graveyard') region = 'Above Graveyard';
        if (region == 'Kakariko') region = 'Kakariko Village';
        stone = hint.split('(')[1].split(')')[0].trim();
        if (!(region in $scope.gossipHints)) {
          $scope.gossipHints[region] = {};
        }
        $scope.gossipHints[region][stone] = logfile['gossip_stones'][hint]['text'].replace(/#/g,'');
      }

      $scope.gossipHints['Kokiri Forest'] = $scope.gossipHints['KF'];
      $scope.gossipHints['Lost Woods'] = $scope.gossipHints['LW'];
      $scope.gossipHints['Sacred Forest Meadow'] = $scope.gossipHints['SFM'];
      $scope.gossipHints['Death Mountain Crater'] = $scope.gossipHints['DMC'];
      $scope.gossipHints['Death Mountain Trail'] = $scope.gossipHints['DMT'];
      $scope.gossipHints['Goron City'] = $scope.gossipHints['GC'];
      $scope.gossipHints['Gerudo Valley'] = $scope.gossipHints['GV'];
      $scope.gossipHints['Hyrule Castle'] = $scope.gossipHints['HC'];
      $scope.gossipHints['Hyrule Field'] = $scope.gossipHints['HF'];
      $scope.gossipHints['Kakariko Village'] = $scope.gossipHints['Kak'];
      $scope.gossipHints['Lake Hylia'] = $scope.gossipHints['LH'];
      $scope.gossipHints['Temple of Time'] = $scope.gossipHints['ToT'];
      $scope.gossipHints["Zoras Domain"] = $scope.gossipHints['ZD'];
      $scope.gossipHints["Zoras Fountain"] = $scope.gossipHints['ZF'];
      $scope.gossipHints["Zora River"] = $scope.gossipHints['ZR'];
      $scope.gossipHints["Desert Colossus"] = $scope.gossipHints['Colossus']

      $scope.checkedLocations.push('Links Pocket');
      $scope.currentItemsAll.push($scope.allLocations['Links Pocket']);
      $scope.numChecksMade++;
      $scope.knownMedallions['Free'] = $scope.allLocations['Links Pocket'];
      $scope.medallions['Free'] = $scope.allLocations['Links Pocket'];
      $scope.medallions['Deku Tree'] = $scope.allLocations['Queen Gohma'];
      $scope.medallions['Dodongos Cavern'] = $scope.allLocations['King Dodongo'];
      $scope.medallions['Jabu Jabus Belly'] = $scope.allLocations['Barinade'];
      $scope.medallions['Forest Temple'] = $scope.allLocations['Phantom Ganon'];
      $scope.medallions['Fire Temple'] = $scope.allLocations['Volvagia'];
      $scope.medallions['Water Temple'] = $scope.allLocations['Morpha'];
      $scope.medallions['Shadow Temple'] = $scope.allLocations['Bongo Bongo'];
      $scope.medallions['Spirit Temple'] = $scope.allLocations['Twinrova'];
      $scope.playing = true;
      $scope.route += '---- CHILD ' + $scope.currentChild + ' ----\n\n';

      // $scope.currentRegion = $scope.adult_spawn_text = logfile['randomized_settings']['starting_age'] == 'child' 
      // ? logfile['entrances']['Child Spawn -> KF Links House']['region'] 
      // : logfile['entrances']['Adult Spawn -> Temple of Time']['region'];

      $scope.currentAge = logfile['randomized_settings']['starting_age'] == 'child' ? 'Child' : 'Adult';

      $scope.currentRegion = $scope.currentAge == 'Child' ? childRegion : adultRegion;
      $scope.checkLocation('Song from Impa')

      $scope.updateForage();
    }
    catch(err) {
      alert('Error parsing file! Please choose a randomizer spoiler log.');
    }
  };
  
  $scope.getShopImage = function(item) {
    if (item.includes('Small Key')) {
      return 'small_key.png';
    }
    else if (item.includes('Boss Key')) {
      return 'boss_key.png';
    }
    else if (item.includes('Map')) {
      return 'map.png';
    }
    else if (item.includes('Compass')) {
      return 'compass.png';
    }
    else {
      return shopItemImages[item] || item;
    }
  };
  
  $scope.shopNPCs = {
    'Kokiri Shop': 'kokirishopnpc.png',
    'Castle Town Bazaar': 'marketbazaarnpc.png',
    'Castle Town Potion Shop': 'marketpotionnpc.png',
    'Bombchu Shop': 'bombchunpc.png',
    'Kakariko Bazaar': 'marketbazaarnpc.png',
    'Kakariko Potion Shop': 'marketpotionnpc.png',
    'Zora Shop': 'zoranpc.png',
    'Goron Shop': 'goronnpc.png',
  };
  
  var getShop = function(location) {
    var shop = location.split('Item')[0].trim();
    if (['Kokiri Shop', 'Castle Town Bazaar', 'Castle Town Potion Shop', 'Bombchu Shop', 'Kakariko Bazaar', 'Kakariko Potion Shop', 'Goron Shop', 'Zora Shop'].includes(shop)) {
      return shop;
    }
    else {
      return '';
    }
  };
  
  $scope.buyItem = function(ind) {
    if ($scope.shopContents[$scope.currentShop()][ind].bought) {
      return;
    }
    $scope.actions.push('Buy:' + $scope.currentShop() + ':' + ind);
    var item = $scope.shopContents[$scope.currentShop()][ind].item;
    if (!$scope.shopContents[$scope.currentShop()][ind].refill) {
      $scope.checkedLocations.push("shopitem|" + $scope.currentShop() + "|" + ind);
      $scope.shopContents[$scope.currentShop()][ind].bought = true;
    
      $scope.numChecksMade++;
      
      if (importantItems.includes(item)) {
        $scope.route += 'Bought ' + item + ' from ' + $scope.currentShop() + '\n';
      }
    
      
      if (warpSongs.includes(item)) {
        $scope.collectedWarps.push(item);
      }
      
      if ($scope.checkedLocations.length >= 2) {
        $scope.disableUndo = false;
      }
    }
    $scope.currentItemsAll.push(item);
    $scope.lastchecked = $scope.currentShop() + ': ' + item;
    $scope.itemCounts[item]++;
    $scope.updateForage();
  };
  
  var forageItems = ['windRegionChild', 'windRegionAdult', 'peekedLocations', 'currentSeed', 'isShopsanity', 'shopContents', 'currentSpoilerLog', 'checkedHints', 'knownHints', 'allLocations', 'fsHash', 'checkedLocations', 'currentItemsAll', 'medallions', 'currentRegion', 'currentAge', 'knownMedallions', 'numChecksMade', 'totalChecks', 'gossipHints', 'itemCounts', 'usedChus', 'collectedWarps', 'finished', 'route', 'currentChild', 'currentAdult', 'playing', 'disableUndo', 'darkModeOn', 'actions', 'child_spawn', 'child_spawn_text', 'checked_child_spawn', 'adult_spawn', 'adult_spawn_text', 'checked_adult_spawn',]
  
  $scope.updateForage = function() {
    forageItems.forEach(function(item) {
      localforage.setItem(item, $scope[item]);
    });    

    
    var localChildSpawn = $scope['currentSpoilerLog']['entrances']['Child Spawn -> KF Links House']['region'] === undefined ? $scope['currentSpoilerLog']['entrances']['Child Spawn -> KF Links House'] : $scope['currentSpoilerLog']['entrances']['Child Spawn -> KF Links House']['region'];
    var localAdultSpawn = $scope['currentSpoilerLog']['entrances']['Adult Spawn -> Temple of Time']['region'] === undefined ? $scope['currentSpoilerLog']['entrances']['Adult Spawn -> Temple of Time'] : $scope['currentSpoilerLog']['entrances']['Adult Spawn -> Temple of Time']['region'];

    localforage.setItem('child_spawn', getSpawn(localChildSpawn));
    localforage.setItem('child_spawn_text', localChildSpawn);
    localforage.setItem('checked_child_spawn', checked_child_spawn);
    localforage.setItem('adult_spawn', getSpawn(localAdultSpawn));
    localforage.setItem('adult_spawn_text', localAdultSpawn);
    localforage.setItem('checked_adult_spawn', checked_adult_spawn);
    localforage.setItem('playing', $scope.playing);
    localforage.setItem('fsHash', $scope.fsHash);
  }
  
  Promise.all(
    forageItems.map(x => localforage.getItem(x))
  ).then(function(results) {    
    checked_child_spawn = results[33];
    child_spawn_text = checked_child_spawn == true ? results[32] : '???';
    child_spawn = results[31];

    checked_adult_spawn = results[36];
    adult_spawn_text = checked_adult_spawn == true ? results[35] : '???';
    adult_spawn = results[34];

    for (var i = 0; i < forageItems.length; i++) {
      if (results[i] != null && results[i] != undefined) {   
        $scope[forageItems[i]] = results[i];
      }   
    }
    $scope.$apply();
  });
  
});


function parseHint(hint) {
  var hintLoc = [];
  var hintItem = [];
  for (loc in hintLocationsMeanings) {
    if (hint.includes(loc)) {
      if (typeof(hintLocationsMeanings[loc]) == 'string') {
        hintLoc = hintLocationsMeanings[loc];
      }
      else {
        hintLoc = hintLocationsMeanings[loc]();
      }
      break;
    }
  }
  for (item in hintItemsMeanings) {
    if (hint.includes(item)) {
      hintItem = hintItemsMeanings[item];
      break;
    }
  }
  return [hintLoc, hintItem];
}

var shopItemImages = {
  'Arrows (5)': 'arrows5.png',
  'Arrows (10)': 'arrows10.png',
  'Arrows (30)': 'arrows30.png',
  'Arrows (50)': 'arrows50.png',
  'Biggoron Sword': 'sword3.png',
  'Blue Fire': 'bluefire.png',
  'Blue Potion': 'bluepotion.png',
  'Bolero of Fire': 'red_note.png',
  'Bomb Bag': 'bombbag.png',
  'Bombchu (5)': 'bombchu5.png',
  'Bombchu (10)': 'bombchu10.png',
  'Bombchu (20)': 'bombchu20.png',
  'Bombchus (5)': 'bombchu5.png',
  'Bombchus (10)': 'bombchu10.png',
  'Bombchus (20)': 'bombchu20.png',
  'Bombchus': 'bombchu.png',
  'Bombs (5)': 'bombs5.png',
  'Bombs (10)': 'bombs10.png',
  'Bombs (20)': 'bomb2.png',
  'Bombs (30)': 'bomb3.png',
  'Boomerang': 'boomerang.png',
  'Bottle with Big Poe': 'bigpoe.png',
  'Bottle with Blue Fire': 'bluefire.png',
  'Bottle with Blue Potion': 'bluepotion.png',
  'Bottle with Bugs': 'bug.png',
  'Bottle with Fairy': 'fairy.png',
  'Bottle with Fish': 'fish.png',
  'Bottle with Green Potion': 'greenpotion.png',
  'Rutos Letter': 'bottle-letter.png',
  'Bottle with Milk': 'milk.png',
  'Bottle with Poe': 'poe.png',
  'Bottle with Red Potion': 'redpotion.png',
  'Bow': 'bow.png',
  'Bottle Bug': 'bug.png',
  'Broken Sword': 'broken_sword.png',
  'Claim Check': 'claim.png',
  'Cojiro': 'cojiro.png',
  'Deku Nut (5)': 'nuts5.png',
  'Deku Nuts (5)': 'nuts5.png',
  'Deku Nut (10)': 'nuts10.png',
  'Deku Nuts (10)': 'nuts10.png',
  'Deku Nut Capacity': 'nutupgrade.png',
  'Deku Seeds (30)': 'seeds30.png',
  'Deku Shield': 'shield1.png',
  'Deku Stick (1)': 'stick.png',
  'Deku Stick Capacity': 'stickupgrade.png',
  'Dins Fire': 'din.png',
  'Eponas Song': 'epona.png',
  'Eyeball Frog': 'frog.png',
  'Eyedrops': 'eyedrops.png',
  'Fairy\'s Spirit': 'fairy.png',
  'Farores Wind': 'farore.png',
  'Fire Arrows': 'firearrow.png',
  'Fish': 'fish.png',
  'Gold Skulltula Token': 'token.png',
  'Goron Tunic': 'redtunic.png',
  'Green Potion': 'greenpotion.png',
  'Megaton Hammer': 'hammer.png',
  'Heart': 'recoveryheart.png',
  'Heart Container': 'heartcontainermodel.png',
  'Hover Boots': 'hoverboots.png',
  'Hylian Shield': 'shield2.png',
  'Ice Arrows': 'icearrow.png',
  'Ice Trap': 'icetrap.png',
  'Iron Boots': 'ironboots.png',
  'Kokiri Sword': 'sword1.png',
  'Lens of Truth': 'lens.png',
  'Light Arrows': 'lightarrow.png',
  'Magic Meter': 'magic.png',
  'Minuet of Forest': 'green_note.png',
  'Mirror Shield': 'shield3.png',
  'Nayrus Love': 'nayru.png',
  'Nocturne of Shadow': 'purple_note.png',
  'Ocarina': 'fairyocarina.png',
  'Odd Mushroom': 'mushroom.png',
  'Piece of Heart': 'heartpiecemodel.png',
  'Piece of Heart (Treasure Chest Game)': 'heartpiecemodel.png',
  'Poachers Saw': 'saw.png',
  'Pocket Cucco': 'cucco.png',
  'Pocket Egg': 'egg.png',
  'Poe': 'poe.png',
  'Progressive Hookshot': 'hookshotd.png',
  'Progressive Scale': 'scale1.png',
  'Progressive Strength Upgrade': 'lift2.png',
  'Progressive Wallet': 'walletmodel.png',
  'Prelude of Light': 'yellow_note.png',
  'Prescription': 'prescription.png',
  'Recovery Heart': 'recoveryheart.png',
  'Red Potion': 'redpotion.png',
  'Requiem of Spirit': 'orange_note.png',
  'Rupee (1)': 'greenrupee.png',
  'Rupees (5)': 'bluerupee.png',
  'Rupees (20)': 'redrupee.png',
  'Rupees (50)': 'purplerupee.png',
  'Rupees (200)': 'hugerupee.png',
  'Sarias Song': 'saria.png',
  'Serenade of Water': 'blue_note.png',
  'Slingshot': 'slingshot.png',
  'Song of Storms': 'songofstorms.png',
  'Song of Time': 'songoftime.png',
  'Stone of Agony': 'agony.png',
  'Suns Song': 'sunsong.png',
  'Weird Egg': 'egg.png',
  'Zeldas Lullaby': 'zelda.png',
  'Zora Tunic': 'besttunic.png',
};
