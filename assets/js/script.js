"use strict";
console.clear();
const green = '🟢', red = '🔴', white = '⚪', black = '⚫';
var iceObj = [], freeStun = false, myIP4 = '', myIP6 = '';
const home = '<i class="fa-solid fa-home"></i>';
const globe = '<i class="fa-solid fa-globe"></i>';

function writeCookie() {
    console.log(iceObj);
//	if (!freeStun && preload=='') 
    cookie.set('ice', JSON.stringify(iceObj));
}

function del(index) {
    iceObj.splice(index, 1);
    $('#iceEle_' + index + ', #iceEleRes_' + index).remove();
    // writeCookie();
    return false;
}

function active(index) {
    let active = iceObj[index].active;
    active = !active;
    iceObj[index].active = active;
    $('#active_' + index).removeClass('fa-toggle-on fa-toggle-off black red').addClass('fa-toggle-' + (active ? 'on green' : 'off red'));
    if (!active) $('#iceEleRes_' + index).hide();
    else {
        iceTest(index);
        $('#iceEleRes_' + index).show();
    }
    // writeCookie();
}

function add(index, ice) {
    let cred = ice.username + ':' + ice.password;
    if (cred == ':') cred = '';
    let newRow = '\
	<div id="iceEle_' + index + '" class="col-12 col-lg-6">\
		<div class="m-0 p-1 row border text-left">\
		<div class="col-1 pr-0" id="ice_' + index + '">&nbsp;</div>\
		<div class="col-6 pl-0">' + ice.type + ':' + ice.host + ':' + ice.port + '</div>\
		<div class="col-3">' + cred + '</div>';
    newRow += '\
		<div class="col-1"><i title="Active" id="active_' + index + '" class="fa-solid fa-toggle-' + (ice.active ? 'on' : 'off red') + '" onclick="active(' + index + ');"></i></div>\
		<div class="col-1"><i class="fa-solid fa-trash" onclick="del(' + index + ');"></i></div>';
    newRow += '\
		</div>\
	</div>';
    $('#iceListBody').append(newRow);
    active(index);
    iceTest(index);
}

function list() {
    $('#iceListBody').html('');
    iceObj.forEach(function (ice, index) {
        add(index, ice);
    });
}

const regex = /^(stun|turn|turns)+:([\w\d\.]+):([\d]+)+\s?\[?([^:\]\[\'"]*):?([^:\]\[\'"]*)\]?/;

function iceFromString(str) {
    let m = regex.exec(str.toLowerCase()), ice = {};
    if (m !== null) {
        ice.type = m[1].toUpperCase();
        ice.host = m[2];
        ice.port = m[3];
        ice.username = m[4] || '';
        ice.password = m[5] || '';
        ice.active = false;
        newIce(ice);
    } else alert('Can not parse the string, please refine.\nFormat: stun:domain.tld:port [username:password]');
}

function iceString(e) {
    e.preventDefault();
    let ice = {}, str = $('#icestring').val();
    if (str == '') return false;
    iceFromString(str);
    // writeCookie();
    return false;
}

function newIce(ice) {
    iceObj.push(ice);
    add(iceObj.length - 1, ice);
}

function ice(e) {
    e.preventDefault();
    let ice = {};
    ice.type = $('#type').find(":selected").val();
    ice.active = true;
    ice.host = $('#host').val();
    ice.port = $('#port').val();
    if (ice.host == '' || ice.port == '') return false;
    ice.username = $('#username').val();
    ice.password = $('#password').val();
    newIce(ice);
    return false;
}

function fa(icon, color) {
    return '<i class="fa-solid fa-' + icon + ' ' + color + '"></i>';
}

function findAddr(arr, txt) {
    let found = false;
    arr.forEach(function (addr) {
        if (addr == txt) {
            found = true;
            return true;
        }
    });
    return found;
}

const validType = ['srflx', 'relay'];
let pc = [];

function capitalize(t) {
    return t[0].toUpperCase() + t.slice(1)
}

async function iceTest(index) {
    let diff;
    let ice = iceObj[index];
    let head = ice.type + ':' + ice.host + ':' + ice.port;
    if (ice.username + ice.password != '') head += '&nbsp;[' + ice.username + ':' + ice.password + ']';
    $('#iceEleRes_' + index).remove();
    $('#iceResults').append('\
	<div class="col-12 col-lg-6 mb-4" id="iceEleRes_' + index + '">\
	<div class="row m-0 p-1 border" style="padding-bottom: 0px !important;">\
		<div class="col-1 pr-0" id="res_' + index + '"></div>\
		<div class="col-7 pl-0"><h6>' + head + '</h6></div>\
		<div id="hostname_' + index + '" class="col-4 pl-0 text-right"></div>\
	</div>\
	<div class="row">\
			<div class="col">\
			<div class="m-0 p-1 row border text-left divHead">\
					<div class="col-1 pl-0"></div>\
					<div class="col-2 pl-0">Type</div>\
					<div class="col-2">PRTCL</div>\
					<div class="col-7">Address</div>\
			</div>\
			<div id="RTCice_' + index + '" class="row"></div>\
			<div class="row m-0 p-1 border">\
				<div id="done_' + index + '" class="col-1"></div>\
				<div class="col-4 pl-0" id="state_' + index + '"></div>\
			</div>\
		</div>\
	</div>\
	</div>');

    $('#res_' + index + ', #ice_' + index).html('<i class="fa fa-spinner fa-spin"></i>');
    let iceServers = [{
        urls: ice.type + ':' + ice.host + ':' + ice.port,
        username: ice.username,
        credential: ice.password
    }];
    pc[index] = await new RTCPeerConnection({iceServers});
    pc[index].ts = (Date.now());
    pc[index].addrArray = [];
    pc[index].success = false;
    pc[index].iceType = ice.type;
    let valid, addr, icon, arrow, type;
    pc[index].onicecandidate = (e) => {
        if (e.candidate && e.candidate.type) {
            valid = validType.includes(e.candidate.type);
            type = valid ? green : white;
            icon = !valid ? 'home' : (e.candidate.type == 'relay' ? 'globe' : 'handshake');
            addr = e.candidate.address;
            $('#candidate_' + index).html(home + '&nbsp;' + addr);
            if (e.candidate.protocol == 'udp') arrow = '';
            else {
                switch (e.candidate.tcpType) {
                    case 'active':
                        arrow = 'arrow-right';
                        break;
                    case 'active':
                        arrow = 'arrow-left';
                        break;
                    case 'active':
                        arrow = 'arrow-right-arrow-left';
                        break;
                    default:
                        arrow = '';
                        break;
                }
            }
            arrow = arrow == '' ? '' : fa(arrow, 'grey');
            if (preload != '' && !pc[index].success) $('#RTCice_' + index).find('div').remove();
            if ((pc[index].iceType == 'STUN' && e.candidate.type == 'srflx') || ((pc[index].iceType == 'TURN' || pc[index].iceType == 'TURNS') && e.candidate.type == 'relay')) {
                pc[index].success = true;
            }
            if (!findAddr(pc[index].addrArray, addr + '|' + e.candidate.protocol)) {
                $('#RTCice_' + index).append('\
			<div class="col-12">\
			<div class="row m-0 p-1 border text-left">\
				<div class="col-1 pr-0">' + type + '</div>\
				<div class="col-2 pl-0">' + fa(icon, valid ? 'darkgrey' : 'grey') + '&nbsp;' + e.candidate.type + '</div>\
				<div class="col-2">' + e.candidate.protocol + '&nbsp;' + arrow + '</div>\
				<div class="col-7"><span class="text-break ' + (addr.indexOf(':') != -1 ? 'ip6' : '') + ' ' + ((e.candidate.address == myIP4 || e.candidate.address == myIP6 || valid) ? 'bold' : '') + ' ' + (e.candidate.type == 'relay' ? 'bold green' : '') + '">' + addr + '</span></div>\
			</div>\
			</div>');
                pc[index].addrArray.push(addr + '|' + e.candidate.protocol);
            }
        }
    };
    pc[index].createDataChannel('');
    pc[index].createOffer().then(offer => pc[index].setLocalDescription(offer))

    //pc[index].onsignalingstatechange = (ev) => { console.log('onsignalingstatechange',ev); };
    pc[index].onconnectionstatechange = (ev) => {
        console.log('onconnectionstatechange', ev);
    };
    pc[index].icecandidateerror = (ev) => {
        console.log('icecandidateerror', ev);
    };
    pc[index].oniceconnectionstatechange = (ev) => {
        console.log('oniceconnectionstatechange', ev);
    };
    pc[index].onicegatheringstatechange = (ev) => {
        if (pc[index].iceGatheringState !== 'complete') {
            $('#state_' + index).html('<i>' + capitalize(pc[index].iceGatheringState) + '<span class="blink"> ...</span></i>');
        } else {
            $('#res_' + index + ', #ice_' + index).html((pc[index].success ? green : red));
            diff = (Date.now()) - pc[index].ts;
            if (preload) $('#ms_' + index).html(diff + '&nbsp;<small>ms</small>');
            $('#done_' + index).html(fa('flag', ''));
            $('#state_' + index).html('<i>Complete.</i> ' + diff + '&nbsp;<small>ms</small>');
            $('#candidate_' + index).html(globe + '&nbsp;' + $('#hostname_' + index).html() + ' (' + diff + '&nbsp;<small>ms</small>)');
        }
    };
    pc[index].onnegotiationneeded = (ev) => {
        console.log('onnegotiationneeded', ev);
    };

};

function runTest() {
    let done = 0;
    $('#iceResults').html('');
    iceObj.forEach(function (ice, index) {
        if (iceObj[index].active) {
            done++;
            iceTest(index);
        }
    });
    if (done == 0) alert('Nothing active.');
    return false;
}

function loadExample() {
    stunList();
}

function loadHome() {
    freeStun = false;
    initIce();
}


function initIce() {
    $('#iceResults').html('');
    iceFromString('STUN:freestun.net:3478');
    iceFromString('TURN:freestun.net:3478 [free:free]');
    iceFromString('STUN:freeturn.net:3478');
    iceFromString('TURN:freeturn.net:3478 [free:free]');
}

let preload;
$(document).ready(function () {
    $('#formDiv, #iceResults, #ICE_Results_Div, .credentials').show();
    $('#iceListBody').removeClass('d-none');
    iceObj = [];
    initIce();
});


async function stunList() {
    const IPV4_URL = "https://raw.githubusercontent.com/pradt2/always-online-stun/master/valid_ipv4s.txt";
    const closestAddr = (await (await fetch(IPV4_URL)).text()).trim().split('\n')
    console.log(closestAddr); // prints the IP:PORT of the closest STUN server

    for (let addr of closestAddr) {
        let host_port = addr.trim().split(':')
        let ice = {
            type: "STUN",
            active: false,
            host: host_port[0],
            port: host_port[1],
            username: '',
            password: '',
        };
        newIce(ice);
    }


    // const GEO_USER_URL = "https://geolocation-db.com/json/";
    // const {latitude, longitude, IPv4} = await (await fetch(GEO_USER_URL)).json();
    // myIP4 = IPv4

}