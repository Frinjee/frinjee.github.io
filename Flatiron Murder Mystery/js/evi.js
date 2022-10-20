var select = document.getElementById("evi-list");
var note_res = ("You did this...");
var knife_res = ("You recognize this knife but you cannot place it yet.");
var fPrint_res = ("");
var bullet_res = ("");
var redHair_res = ("");

var evidence_list = ["note", "knife", "fingerprint", "bullet", "red hair"];

for (var i = 0; i < evidence_list.length; i++) {
  var opt = evidence_list[i];
  var el = document.createElement("option");
  el.textContent = opt;
  el.value = opt;
  select.appendChild(el);
}

function getResponse(eleme) {
  var e = document.getElementById("evi-list");
  var strUser = e.options[e.selectedIndex].value;
  if (strUser == 'note') {
    console.log(note_res)
  } else if (strUser == 'knife'){
    console.log(knife_res);
  }
}