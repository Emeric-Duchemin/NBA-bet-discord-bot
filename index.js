const Discord = require("discord.js");
const NBA = require("nba");
require("dotenv").config();
let sem = require("async-mutex");
const client = new Discord.Client();
let guild = undefined;
let channel = undefined;
let betRemaining = -1;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
});
client.on("message", (msg) => {
    guild = msg.guild;
    channel = msg.channel.name;
    check = parseMessage(msg);
    if (check[0]) {
        msg.reply(check[1]);
    }
    /*      const rep = NBA.stats.scoreboard({LeagueID: "00",DayOffset:"1",gameDate:"04/22/2021"}).then(console.log);
          console.log(rep);
        msg.reply("Player Id : "+ rep.playerId);
    }*/
});

function parseMessage(message){
    const cont = message.content
    let index = 0
    while(cont.charAt(index) === " "){
        index += 1
    }
    let ret = [-1,""]
    if(cont.substring(index,index+4) === "!nba"){
        ret = getAction(cont.substring(index+4,cont.length),message);
    }

    switch(ret[0]){
        case 0 :
            return [true,ret[1]];
        case -1 :
            return [false,""]
        case 1 :
            return [true, "This command does not exist. Need help ? Easy ! Just ask : \n"+
            "!nba help"];
        default :
            return [false,""]
    }
}

function getAction(message,completeMessage){
    let index = 0;
    let lstTest = message.split("\n");
    let addIndex = lstTest[0].length;
    while(message.charAt(index) == " "){
        index += 1;
    }
    if(message.substring(index, index+6) === "matchs"){
        printMatch(message.substring(addIndex,message.length));
        return [-1,""];
    }
    if(message.substring(index,index+7) === "results"){
        printResult(message.substring(index+7,message.length));
        return [-1,""];
    }
    if(message.substring(index,index+4) === "bets"){
        treatBet(message.substring(addIndex,message.length),completeMessage);
        return [-1,""];
    }
    if(message.substring(index,index+5) === "check"){
        checkBets(message.substring(addIndex,message.length),completeMessage);
        return [-1,""];
    }
    if(message.substring(index,index+6) === "change"){
        modifyBets(message.substring(addIndex,message.length),completeMessage);
        return [-1,""];
    }
    if(message.substring(index,index+4) === "help"){
        let mess = ""
        mess += "If you want to see today's matches, just ask:\n";
        mess += "**!nba matchs**\n\n";
        mess += "If you want to see yesterday's results, ask: \n";
        mess += "**!nba results**\n\n";
        mess += "If you want to see the result from a specific date, request:\n";
        mess += "**!nba results [date]** \n\n";
        mess += "If you want to bet all your money today, easy:\n";
        mess += "**!nba bets**\n";
        mess += "**[match number] [the amazing team you're supporting (A or B)]**\n\n"
        mess += "If you want to show everybody you won yesterday, inquire:\n";
        mess += "**!nba check**";
        //mess += "Note that last command requires privilege";
        return [0,mess];
    }
    return [1, "Wrong command"];
}

function getTimeOfDay(){
    var d = new Date();
    var hour = d.getHours();
    if (hour < 7){
    	var d = ( function(){this.setDate(this.getDate()-1); return this} )
                .call(new Date);
    }
    var date = d.getDate()
    if (date < 10){
    	date = "0" + d.getDate()
    }
    var month = d.getMonth() + 1
    if (month < 10){
    	month = "0" + (d.getMonth() + 1)
    }
    return month + "/" + date + "/" + d.getFullYear();
}

function getTimeOfPastDay(){
    var d = ( function(){this.setDate(this.getDate()-1); return this} )
            .call(new Date);
    var hour = d.getHours();
    if (hour < 7){
      var d = ( function(){this.setDate(this.getDate()-2); return this} )
                .call(new Date);
    }
    var date = d.getDate()
    if (date < 10){
      date = "0" + d.getDate()
    }
    var month = d.getMonth() + 1
    if (month < 10){
      month = "0" + (d.getMonth() + 1)
    }
    return month + "/" + date + "/" + d.getFullYear();
}

function printMatch(message){
    index = 0;
    while(message.charAt(index) == " "){
        index += 1;
    }
    timeofday = "";
    if(index >= message.length){
        timeofday = getTimeOfDay();
    }else{
        // TODO : vérifier que l'utilisateur ne s'est pas planté dans la date
        // TODO : vérifier que la date demander ne dépasse pas getTimeOfDay
        date = message.substring(index,index+10);
        timeofday = date.substring(3,5) + "/" + date.substring(0,2) + "/" + date.substring(6,10);
    }
    let rep = 0;
    NBA.stats.scoreboard({LeagueID: "00",DayOffset:"0",gameDate:timeofday}).then(result =>
        {msg = getMatchs(result);replyMessage(msg)});
}

function printResult(message){
    index = 0;
    while(message.charAt(index) == " "){
        index += 1;
    }
    timeofday = "";
    if(index >= message.length){
        timeofday = getTimeOfPastDay();
    }else{
        // TODO : vérifier que l'utilisateur ne s'est pas planté dans la date
        // TODO : vérifier que la date demander ne dépasse pas getTimeOfDay
        date = message.substring(index,index+10);
        timeofday = date.substring(3,5) + "/" + date.substring(0,2) + "/" + date.substring(6,10);
    }
    let rep = 0;
    NBA.stats.scoreboard({LeagueID: "00",DayOffset:"0",gameDate:timeofday}).then(result =>
        {msg = getResults(result);replyMessage(msg)});
}

function getMatchs(result){
    lstMatch = result.lineScore;
    console.log(lstMatch);
    msg = "1 ";
    for(let i=0 ; i<lstMatch.length ;i++){
        if(i%2 == 0 && i != 0){
            msg += "\n";
            msg += i/2 + 1 + " ";
        }
        if(i%2 == 1){
            msg += " - ";
        }
        msg += lstMatch[i].teamCityName;
    }
    if(msg == "1 "){
        msg = "No match to display";
    }
    return msg;
}

function getResults(result){
    lstMatch = result.lineScore;
    console.log(lstMatch);
    msg = "";
    let gras1 = "";
    let gras2 = "";
    for(let i=0 ; i<lstMatch.length ;i++){
        if(i%2 == 0 && i != 0){
            msg += "\n";
        }
        if(i%2 == 1){
            if(lstMatch[i].pts == null){
                msg += " - " + " " + lstMatch[i].teamCityName;
            }else{
                msg += " - " + lstMatch[i].pts + " " + gras2 +lstMatch[i].teamCityName + gras2;
            }
        }
        if(i%2 == 0){
            if(lstMatch[i].pts == null){
                gras1 = "";
                gras2 = "";
            }
            else if(lstMatch[i].pts>lstMatch[i+1].pts){
                gras1 = "**";
                gras2 = "";
            }else{
                gras1 = "";
                gras2 = "**";
            }
            if(lstMatch[i].pts == null){
                msg += lstMatch[i].teamCityName + " ";
            }else{
                msg += gras1 + lstMatch[i].teamCityName + gras1 + " " + lstMatch[i].pts;
            }
        }
    }
    if(msg == ""){
        return "No match to display";
    }
    return msg;
}

async function treatBet(text,message){
    const timeofday = getTimeOfDay();
    const me = message.member.user.username;
    const date = getTimeOfDay();
    let mutex = new sem.Mutex();
    const release = await mutex.acquire();
    try{
        let mess = await message.channel.messages.fetchPinned();
        if(mess.array().length == 0){
            replyMessage("NBA Bets !");
        }
        else{
            if(findBet(mess.array()[0].content.split("\n"),date,me) != -1){
                replyMessage("Hey you try to cheat, you've already bet today. It was a fair attempt, but you'll have to try something else.\n If you just wanted to change your bets, use the command **change**.");
                release();
                return;
            }
            let result = await NBA.stats.scoreboard({LeagueID: "00",DayOffset:"0",gameDate:timeofday});
            let msg = constructMessageBet(text,message,result,mess.array()[0]);
            if(msg != -1){
                replyMessage(msg);
            }
        }
        release();
    }catch(e){
        replyMessage("Error while calling NBA API");
        release();
    }
}

// async function treatBet(text,message){
//     const timeofday = getTimeOfDay();
//     const me = message.member.user.username;
//     const date = getTimeOfDay();
//
//     message.channel.messages.fetchPinned().then(mess=>{
//         if(mess.array().length == 0){
//             replyMessage("NBA Bets !");
//         }
//         else{
//             if(findBet(mess.array()[0].content.split("\n"),date,me) != -1){
//                 replyMessage("Hey you try to cheat, you've already bet today. It was a fair attempt, but you'll have to try something else.\n If you just wanted to change your bets, use the command **change**.");
//                 return;
//             }
//             NBA.stats.scoreboard({LeagueID: "00",DayOffset:"0",gameDate:timeofday}).then(result =>
//                 {msg = constructMessageBet(text,message,result,mess.array()[0]);if(msg != -1){replyMessage(msg)}});
//         }
//     });
// }

function constructMessageBet(text,message,matchs,pinned){
    const lstMatch = matchs.lineScore;
    const me = message.member;
    lines = text.split('\n');
    if(lines.length == 1){
        msg = "Wrong bet, try again";
        replyMessage(msg);
        return -1;
    }
    lines.shift();
    let res = 0;
    let messagePinned = "\n" + me.user.username + "  " + getTimeOfDay()+"\n";
    let messageReturn = "";
    let lstMatchBets = [];
    let tablePinned = [];
    let lstError = [];
    let begun = [];
    while(res != -1){
        res = getLineBet(lines[0])
        if(res == -2){
            msg = "Wrong bet, try again";
            replyMessage(msg);
            return -1;
        }
        if(res != -1 && res[0]*2-1 < lstMatch.length && !lstMatchBets.includes(res[0])){
            let bet = "";
            let notPinned = false;
            if(lstMatch[res[0]*2-2].pts != null){
                begun.push(res[0]);
                lines.shift()
                continue;
            }
            lstMatchBets.push(res[0]);
            if(res[1].toLowerCase() == "a"){
                bet = lstMatch[res[0]*2-2].teamAbbreviation;
            }else{
                bet = lstMatch[res[0]*2-1].teamAbbreviation;
            }
            if(res[1].toLowerCase() == "a"){
                messageReturn += "**"+lstMatch[res[0]*2-2].teamCityName+"**" +" - " + lstMatch[res[0]*2-1].teamCityName +"\n";
            }else if(res[1].toLowerCase() == "b"){
                messageReturn += lstMatch[res[0]*2-2].teamCityName +" - " + "**" + lstMatch[res[0]*2-1].teamCityName +"**" + "\n";
            } else{
                lstError.push(res[0]);
                notPinned = true;
              // msg = "Wrong bet, try again";
              // replyMessage(msg);
              // return -1
            }
            if(!notPinned){
                tablePinned.push([res[0],bet]);
            }
        }else if (res[0]*2-1 >= lstMatch.length || lstMatchBets.includes(res[0])) {
            lstError.push(res[0]);
        }
        lines.shift()
    }
    if(messageReturn == ""){
        replyError(lstError, begun);
        return "Wrong bets, try again";
    }else{
        replyError(lstError, begun);
        tablePinned.sort(compareFirstColumn);
        for(let i = 0; i< tablePinned.length; i++){
            messagePinned += tablePinned[i][0] + "." + tablePinned[i][1] + "\n";
        }
        applyModification(messagePinned,pinned);
        return messageReturn;
    }
}

function getLineBet(text){
    if(text == undefined){
      return -1;
    }
    content = text.split(' ');
    if(content.length < 2){
        return -2;
    }
    if(!isNumeric(content[0]) || parseInt(content[0]) == 0 ){
        return -2;
    }
    if(content[1].toLowerCase() != "a" && content[1].toLowerCase() != "b"){
        return [parseInt(content[0]),"c"];
    }
    nbMatch = parseInt(content[0])
    result = content[1];
    return [nbMatch,result];
}

function applyModification(toWrite, message){
    content = message.content;
    content += toWrite;
    message.edit(content);
}

async function checkBets(txt,message){
    let dicResult = {};
    if(betRemaining > -1){
        replyMessage("I'm traiting a nba check demand. Keep calm and play basketball")
        return -1;
    }
    let mutex = new sem.Mutex();
    const release = await mutex.acquire();
    try{
        let msg = await message.channel.messages.fetchPinned()
        if(msg.array().length == 0){
            replyMessage("NBA Bets !");
            replyMessage("NBA Leaderboard");
        }
        else{
            lstBet = msg.array()[0].content.split("\n");
            if(lstBet.length < 2){
                replyMessage("No bets to check");
            }
            let newNbaBets = await treatNextBet(lstBet,msg.array()[1], [],0,dicResult);
            newNbaBets = "NBA bets !\n" + newNbaBets;
            msg.array()[0].edit(newNbaBets);
        }
        release();
    }catch(e){
        replyMessage("Error while calling NBA API");
        release();
    }
}

async function treatNextBet(lstBet, leaderboard, msgLeaderboard, index, dicResult){
    index += 1;
    if(index >= lstBet.length){
        if(msgLeaderboard == ""){
            replyMessage("No bet to treat");
            return "";
        }
        updateLeaderboard(leaderboard, msgLeaderboard);
        msgLeaderboard.sort(compareSecondColumn);
        let mess = "Hey well done **" + msgLeaderboard[msgLeaderboard.length-1][0] + "** you got the highest score\n";
        for(let j=msgLeaderboard.length; j>=1; j--){
            let pos = msgLeaderboard.length+1-j
            mess += pos + ". " + msgLeaderboard[j-1][0] + "   " + msgLeaderboard[j-1][1] + "\n";
        }
        replyMessage(mess);
        return "";
    }
    const pseudo = lstBet[index].substring(0,lstBet[index].length-12);
    const date = lstBet[index].substring(lstBet[index].length-10,lstBet[index].length);
    if(date == getTimeOfDay()){
        let lst = getFollowingBet(lstBet,index);
        let m = await treatNextBet(lstBet,leaderboard, msgLeaderboard,lst.length + index-1,dicResult);
        let messageToDay = "";
        for(let j = 0; j<lst.length ; j++){
            messageToDay += lst[j] + "\n";
        }
        return messageToDay + m;
    }
    betRemaining -= 1;
    let result;
    if(!(date in dicResult)){
        result = await NBA.stats.scoreboard({LeagueID: "00",DayOffset:"0",gameDate:date})
        dicResult[date] = result;
    }else{
        result = dicResult[date];
    }
    msg = computeScore(lstBet,index,result);
    msgLeaderboard = msgLeaderboard.concat([[pseudo,msg[1]]]);
    treatNextBet(lstBet,leaderboard, msgLeaderboard,msg[0],dicResult);
    return "NBA Bets !";
}


function computeScore(lstBet,index,matches){
    lstMatch = matches.lineScore;
    index += 1;
    let continuePlayer = true;
    let pts = 0
    while(continuePlayer){
        if(index >= lstBet.length||
           (lstBet[index][lstBet[index].length-4] !== "." && lstBet[index][lstBet[index].length-4] !== ".")){
            continuePlayer = false;
        }else{
            res = lstBet[index].split(".");
            nbMatch = parseInt(res[0]);
            if((lstMatch[2*nbMatch-2].pts>lstMatch[2*nbMatch-1].pts && res[1] === lstMatch[2*nbMatch-2].teamAbbreviation) ||
               (lstMatch[2*nbMatch-2].pts<lstMatch[2*nbMatch-1].pts && res[1] === lstMatch[2*nbMatch-1].teamAbbreviation)){
                pts += 3;
            }
        }
        index += 1
    }
    index -= 2;
    return [index, pts];
}

function updateLeaderboard(leaderboard, msgLeaderboard){
    const cont = leaderboard.content;
    let lstPlayersScore = cont.split("\n");
    lstPlayersScore = lstPlayersScore.slice(1);
    let  res = lstPlayersScore.map(x => {let res=x.split(" "); return [res[1],parseInt(res[4])];}); // 1 4
    for( let i = 0; i<msgLeaderboard.length; i++){
        let ind = find(res, msgLeaderboard, i);
        if(ind == -1){
            res = res.concat([msgLeaderboard[i]]);
        }
        else{
            res[ind][1] = res[ind][1] + parseInt(msgLeaderboard[i][1]);
        }
    }
    res.sort(compareSecondColumn);
    retScore = "Leaderboard :\n";
    for(let j=res.length; j>=1; j--){
        let pos = res.length+1-j
        retScore += pos + ". " + res[j-1][0] + "   " + res[j-1][1] + "\n";
    }
    leaderboard.edit(retScore);
}

async function modifyBets(msg, message){
    newBets = msg.split("\n");
    let ind = 0;
    let date = ""
    while(ind<newBets[0].length && newBets[0][ind] == " "){
        ind += 1
    }
    if(ind<newBets[0].length){
        date = newBets.substring(ind,ind+10);
    }else{
        date = getTimeOfDay();
    }
    let mutex = new sem.Mutex();
    const release = await mutex.acquire();
    try{
        let mess = await message.channel.messages.fetchPinned();
        lstBet = mess.array()[0].content.split("\n");
        me = message.member.user.username;
        let indBet = findBet(lstBet, date, me);
        if(indBet == -1){
            replyMessage("Bet before changing, why did you do that, memory issues ?");
            release();
            return;
        }
        let result = await NBA.stats.scoreboard({LeagueID: "00",DayOffset:"0",gameDate:date})
        msg = compareBet(lstBet, indBet, newBets.slice(1), result);
        if(msg == -1){
            replyMessage("Wrong changes, try again");
            release();
            return;
        }
        mess.array()[0].edit(msg);
        release();
    }catch(e){
        replyMessage("Error while calling NBA API");
        release();
    }
}

function findBet(lst, date, pseudo){
    for(let i= 0; i<lst.length; i++){
        if(lst[i][lst[i].length-4] == "."){
            continue;
        }
        subList = lst[i].split("  ");
        if(date == subList[1] && pseudo == subList[0]){
            i += 1;
            const rem = i;
            while(i<lst.length && lst[i][lst[i].length-4] == "."){
                i += 1
            }
            return [rem, i];
        }
    }
    return -1;
}

function errorOnBet(content){
    if(content.length < 2){
        return true;
    }
    if(!isNumeric(content[0]) || parseInt(content[0]) == 0){
        return true;
    }
    return false;
}

function compareBet(lstBet, indBet, newBets, res){
    let lstMatch = res.lineScore;
    let lstError = [];
    let begun = [];
    for (let i = 0; i<newBets.length; i++){
        let bet = newBets[i].split(" ");
        let error = errorOnBet(bet);
        if(error){
            return -1;
        }
        let abb = "";
        if(bet[0]*2-1 >= lstMatch.length){
            lstError.push(bet[0]);
            continue;
        }
        if(lstMatch[parseInt(bet[0])*2-2].pts != null){
            begun.push(bet[0]);
            continue;
        }
        if(bet[1].toLowerCase() == "a"){
            abb = lstMatch[parseInt(bet[0])*2-2].teamAbbreviation;
        }else if(bet[1].toLowerCase() == "b"){
            abb = lstMatch[parseInt(bet[0])*2-1].teamAbbreviation;
        }else{
            lstError.push(bet[0]);
            continue;
        }
        let numb = findNumber(lstBet,indBet[0],indBet[1],bet[0])
        if(numb[0]){
            lstBet[numb[1]] = bet[0]+"."+abb;
        }else{
            let appen = bet[0]+"."+abb;
            lstBet.splice(numb[1],0,appen);
            indBet[1] += 1;
        }
    }
    let msg = lstBet[0] + "\n";
    let messageReturn = "Your new bets :\n";
    for(let j=1; j<lstBet.length; j++){
        let thebet = lstBet[j].split(".");
        if(thebet.length > 1 && j>=indBet[0] && j<= indBet[1]){
            if(thebet[1] == lstMatch[parseInt(thebet[0])*2-1].teamAbbreviation){
                messageReturn += lstMatch[parseInt(thebet[0])*2-2].teamCityName +" - " + "**"+  lstMatch[parseInt(thebet[0])*2-1].teamCityName + "**"+"\n";
            }else{
                messageReturn += "**" + lstMatch[parseInt(thebet[0])*2-2].teamCityName + "**" +" - " + lstMatch[parseInt(thebet[0])*2-1].teamCityName + "\n";
            }
        }
        msg += lstBet[j] + "\n";
    }
    replyMessage(messageReturn);

    replyError(lstError, begun);
    return msg;
}

function compareSecondColumn(a, b) {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] < b[1]) ? -1 : 1;
    }
}

function compareFirstColumn(a, b) {
    if (a[0] === b[0]) {
        return 0;
    }
    else {
        return (a[0] < b[0]) ? -1 : 1;
    }
}

function find(searchList, elemList, index){
    elem = elemList[index][0]
    for(let i = 0; i<searchList.length; i++){
        if(searchList[i][0] == elem){
            return i;
        }
    }
    return -1
}

function findNumber(lstBet,indBeg, indEnd,numb){
    let i = indBeg;
    for (i= indBeg; i<indEnd;i++){
        check = lstBet[i].split(".");
        if(check[0] == numb){
            return[true,i];
        }
        if(parseInt(check[0]) >= parseInt(numb)){
            return [false,i];
        }
    }
    return[false,i];
}

function replyMessage(toRep){
    const chan = client.channels.cache.find(chann => chann.name === channel);
    chan.send(toRep);
}

function toAmericanDate(date){
    return date.substring(3,5) + "/" + date.substring(0,2) + "/" + date.substring(6,10);
}

function isNumeric(value) {
    return /^\d+$/.test(value);
}

function replyError(lstError, begun){
    if(lstError.length > 0){
        let messError = "Hey, are you drunk ? You've made wrong bets on :\n";
        for(let i=0; i<lstError.length; i++){
            messError += "- " + lstError[i] + "\n";
        }
        if( begun.length > 0){
            messError += "\n \n The following match/es :";
            for(let i=0; i<begun.length; i++){
                messError += "- " + begun[i] + "\n";
            }
            messError += "has/have already begun, you cannot bet on it. You're too slow !\n\n";
        }
        replyMessage(messError);
    }else if(begun.length > 0){
        let messError = "The following match/es :\n";
        for(let i=0; i<begun.length; i++){
            messError += "- " + begun[i] + "\n";
        }
        messError += "has/have already begun, you cannot bet on it. You're too slow !\n\n";
        replyMessage(messError);
    }
    return;
}

function getFollowingBet(lstBet, ind){
    let i = ind+1;
    while(i<lstBet.length && lstBet[i][lstBet[i].length-4] == "."){
        i += 1;
    }
    let clone = lstBet.slice();
    return clone.splice(ind, i-1);
}

client.login(process.env.CLIENT_TOKEN);

// TODO
// Gérer des exécutions concurrentes (sémaphore).
// Passage sur AWS
// Gérer les cas d'erreur sur les paris
// Si plusieurs paris merge les scores des joueurs dans le retour de check


// on ne peut pas parier si le match a déjà commencé //


// Are you drunk n'affiche pas certains paris //
// Virer are you drunk à chaque fois //
// être plus intelligent sur le check et pas juste réinitialiser, on garde les paris qui sont pas encore passé //
// Faire un tableau qui retient les dates qu'on a déjà demandé pour pas les redemander 500 fois (check) //
// Cas de bug, on met plusieurs fois le même matchs + on dépasse sur les matchs + gérer le cas ou tout a été viré du coup liste vide + avertir numéro de bets non valides //
// !nba change affiche les paris actuels //
// Si y a un espace à la fin du bet on s'en bat le steack mais pour le moment ça marche pas //
// TO lowercase A B des paris //
// Vérifier dans le check qu'il y a bien des paris //
