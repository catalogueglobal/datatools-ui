import upperFirst from 'lodash.upperfirst'
import React from "react";
import { ControlLabel, FormControl, FormGroup, Table } from 'react-bootstrap'

let agencyData = {"agencyName":"alhambra-community-transit","debugDetails":{"weekday":{"1340.1":{"directions":{"blank":{"maxStopCountByHour":[0,0,0,0,0,0,0,5,6,6,6,6,6,6,6,6,6,6,1,0,0,0,0,0],"stops":{"10017":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10018":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10019":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10023":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10024":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10025":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10028":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10030":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10031":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10033":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10034":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10036":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10037":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0]},"10039":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10041":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0]},"10043":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0]},"10045":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10049":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0]},"10050":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10052":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0]},"10055":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0]},"10056":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0]},"10058":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10060":{"stopCountByHour":[0,0,0,0,0,0,0,5,6,6,6,6,6,6,6,6,6,6,1,0,0,0,0,0]}}}},"maxStopCountByHour":[0,0,0,0,0,0,0,5,6,6,6,6,6,6,6,6,6,6,1,0,0,0,0,0],"name":"ATGRN - ALHAMBRA TRANSIT GREEN RT"},"1342.1":{"directions":{"blank":{"maxStopCountByHour":[0,0,0,0,0,0,0,5,6,6,6,6,6,6,6,6,6,6,1,0,0,0,0,0],"stops":{"10016":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10017":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10018":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10019":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10023":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10024":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0]},"10025":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10026":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10028":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10030":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0]},"10031":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10033":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0]},"10034":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10036":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0]},"10037":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10039":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0]},"10041":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10043":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10045":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0]},"10050":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0]},"10051":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10052":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10055":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10056":{"stopCountByHour":[0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0]},"10058":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0]},"10060":{"stopCountByHour":[0,0,0,0,0,0,0,5,6,6,6,6,6,6,6,6,6,6,1,0,0,0,0,0]}}}},"maxStopCountByHour":[0,0,0,0,0,0,0,5,6,6,6,6,6,6,6,6,6,6,1,0,0,0,0,0],"name":"ATGRN - ALHAMBRA TRANSIT GREEN RT_1"},"1344.1":{"directions":{"blank":{"maxStopCountByHour":[0,0,0,0,0,0,2,3,2,0,0,0,0,0,1,3,3,3,3,0,0,0,0,0],"stops":{"10006":{"stopCountByHour":[0,0,0,0,0,0,2,3,1,0,0,0,0,0,1,3,3,3,1,0,0,0,0,0]},"10009":{"stopCountByHour":[0,0,0,0,0,0,2,3,1,0,0,0,0,0,1,3,3,3,1,0,0,0,0,0]},"10010":{"stopCountByHour":[0,0,0,0,0,0,2,3,1,0,0,0,0,0,1,3,3,3,1,0,0,0,0,0]},"10013":{"stopCountByHour":[0,0,0,0,0,0,2,3,1,0,0,0,0,0,0,3,3,3,2,0,0,0,0,0]},"10016":{"stopCountByHour":[0,0,0,0,0,0,1,3,2,0,0,0,0,0,0,3,3,3,2,0,0,0,0,0]},"10017":{"stopCountByHour":[0,0,0,0,0,0,1,3,2,0,0,0,0,0,0,3,3,3,2,0,0,0,0,0]},"10018":{"stopCountByHour":[0,0,0,0,0,0,1,3,2,0,0,0,0,0,0,3,3,3,2,0,0,0,0,0]},"10019":{"stopCountByHour":[0,0,0,0,0,0,1,3,2,0,0,0,0,0,0,3,3,3,2,0,0,0,0,0]},"10020":{"stopCountByHour":[0,0,0,0,0,0,2,3,1,0,0,0,0,0,0,3,3,3,2,0,0,0,0,0]},"10023":{"stopCountByHour":[0,0,0,0,0,0,1,3,2,0,0,0,0,0,0,3,3,3,2,0,0,0,0,0]},"10027":{"stopCountByHour":[0,0,0,0,0,0,1,3,2,0,0,0,0,0,0,3,3,3,2,0,0,0,0,0]},"10029":{"stopCountByHour":[0,0,0,0,0,0,1,3,2,0,0,0,0,0,0,3,3,3,2,0,0,0,0,0]},"10035":{"stopCountByHour":[0,0,0,0,0,0,1,3,2,0,0,0,0,0,0,3,3,3,2,0,0,0,0,0]},"10040":{"stopCountByHour":[0,0,0,0,0,0,1,3,2,0,0,0,0,0,0,3,3,3,2,0,0,0,0,0]},"10042":{"stopCountByHour":[0,0,0,0,0,0,1,3,2,0,0,0,0,0,0,3,3,3,2,0,0,0,0,0]},"10043":{"stopCountByHour":[0,0,0,0,0,0,1,3,2,0,0,0,0,0,0,3,3,3,2,0,0,0,0,0]},"10044":{"stopCountByHour":[0,0,0,0,0,0,1,3,2,0,0,0,0,0,0,3,3,3,2,0,0,0,0,0]},"10046":{"stopCountByHour":[0,0,0,0,0,0,1,3,2,0,0,0,0,0,0,3,3,3,2,0,0,0,0,0]},"10049":{"stopCountByHour":[0,0,0,0,0,0,1,3,2,0,0,0,0,0,0,2,3,3,3,0,0,0,0,0]}}}},"maxStopCountByHour":[0,0,0,0,0,0,2,3,2,0,0,0,0,0,1,3,3,3,3,0,0,0,0,0],"name":"ATBLU - ALHAMBRA TRANSIT BLUE RT"},"1345.1":{"directions":{"blank":{"maxStopCountByHour":[0,0,0,0,0,0,1,3,3,0,0,0,0,0,2,3,3,3,3,0,0,0,0,0],"stops":{"10006":{"stopCountByHour":[0,0,0,0,0,0,0,3,2,0,0,0,0,0,1,3,3,3,3,0,0,0,0,0]},"10009":{"stopCountByHour":[0,0,0,0,0,0,0,2,3,0,0,0,0,0,1,3,3,3,3,0,0,0,0,0]},"10013":{"stopCountByHour":[0,0,0,0,0,0,0,3,2,0,0,0,0,0,1,3,3,3,3,0,0,0,0,0]},"10016":{"stopCountByHour":[0,0,0,0,0,0,0,3,2,0,0,0,0,0,1,3,3,3,3,0,0,0,0,0]},"10017":{"stopCountByHour":[0,0,0,0,0,0,0,3,2,0,0,0,0,0,1,3,3,3,3,0,0,0,0,0]},"10018":{"stopCountByHour":[0,0,0,0,0,0,0,3,2,0,0,0,0,0,1,3,3,3,3,0,0,0,0,0]},"10019":{"stopCountByHour":[0,0,0,0,0,0,0,3,2,0,0,0,0,0,1,3,3,3,3,0,0,0,0,0]},"10020":{"stopCountByHour":[0,0,0,0,0,0,0,3,2,0,0,0,0,0,1,3,3,3,3,0,0,0,0,0]},"10023":{"stopCountByHour":[0,0,0,0,0,0,0,3,2,0,0,0,0,0,2,3,3,3,2,0,0,0,0,0]},"10027":{"stopCountByHour":[0,0,0,0,0,0,0,3,2,0,0,0,0,0,2,3,3,3,2,0,0,0,0,0]},"10029":{"stopCountByHour":[0,0,0,0,0,0,0,3,2,0,0,0,0,0,2,3,3,3,2,0,0,0,0,0]},"10035":{"stopCountByHour":[0,0,0,0,0,0,0,3,2,0,0,0,0,0,2,3,3,3,2,0,0,0,0,0]},"10040":{"stopCountByHour":[0,0,0,0,0,0,0,3,2,0,0,0,0,0,2,3,3,3,2,0,0,0,0,0]},"10044":{"stopCountByHour":[0,0,0,0,0,0,1,3,1,0,0,0,0,0,2,3,3,3,2,0,0,0,0,0]},"10046":{"stopCountByHour":[0,0,0,0,0,0,1,3,1,0,0,0,0,0,2,3,3,3,2,0,0,0,0,0]},"10049":{"stopCountByHour":[0,0,0,0,0,0,1,3,1,0,0,0,0,0,2,3,3,3,2,0,0,0,0,0]}}}},"maxStopCountByHour":[0,0,0,0,0,0,1,3,3,0,0,0,0,0,2,3,3,3,3,0,0,0,0,0],"name":"ATBLU - ALHAMBRA TRANSIT BLUE RT_1"}},"saturday":{"1340.1":{"directions":{"blank":{"maxStopCountByHour":[0,0,0,0,0,0,0,0,0,0,5,6,6,6,6,5,0,0,0,0,0,0,0,0],"stops":{"10017":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10018":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10019":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10023":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10024":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10025":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10028":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10030":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10031":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10033":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10034":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10036":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10037":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,0,0,0,0,0,0,0,0]},"10039":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10041":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,0,0,0,0,0,0,0,0]},"10043":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,0,0,0,0,0,0,0,0]},"10045":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10049":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,0,0,0,0,0,0,0,0]},"10050":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10052":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,0,0,0,0,0,0,0,0]},"10055":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,0,0,0,0,0,0,0,0]},"10056":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,0,0,0,0,0,0,0,0]},"10058":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10060":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,5,6,6,6,6,5,0,0,0,0,0,0,0,0]}}}},"maxStopCountByHour":[0,0,0,0,0,0,0,0,0,0,5,6,6,6,6,5,0,0,0,0,0,0,0,0],"name":"ATGRN - ALHAMBRA TRANSIT GREEN RT"},"1342.1":{"directions":{"blank":{"maxStopCountByHour":[0,0,0,0,0,0,0,0,0,0,5,6,6,6,6,5,0,0,0,0,0,0,0,0],"stops":{"10016":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10017":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10018":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10019":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10023":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10024":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,0,0,0,0,0,0,0,0]},"10025":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10026":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10028":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10030":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,0,0,0,0,0,0,0,0]},"10031":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10033":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,0,0,0,0,0,0,0,0]},"10034":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10036":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,0,0,0,0,0,0,0,0]},"10037":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10039":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,0,0,0,0,0,0,0,0]},"10041":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10043":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10045":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,0,0,0,0,0,0,0,0]},"10050":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,0,0,0,0,0,0,0,0]},"10051":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10052":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10055":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10056":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,2,0,0,0,0,0,0,0,0]},"10058":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,0,0,0,0,0,0,0,0]},"10060":{"stopCountByHour":[0,0,0,0,0,0,0,0,0,0,5,6,6,6,6,5,0,0,0,0,0,0,0,0]}}}},"maxStopCountByHour":[0,0,0,0,0,0,0,0,0,0,5,6,6,6,6,5,0,0,0,0,0,0,0,0],"name":"ATGRN - ALHAMBRA TRANSIT GREEN RT_1"}},"sunday":{}},"stopNames":{"10006":"PASEO RANCHO CASTILLA/2005 PASEO RANCHO CASTILLA","10009":"CIRCLE DR/CAL STATE LA STATION","10010":"PASEO RANCHO CASTILLA/MARIONDALE AV","10013":"HELLMAN AV/WESTBORO AV","10016":"COMMONWEALTH AV/FREMONT AV","10017":"FREMONT AV/ORANGE ST","10018":"FREMONT AV/MISSION RD","10019":"VALLEY BLVD/FREMONT AV","10020":"HELLMAN AV/FREMONT AV","10023":"COMMONWEALTH AV/PALM AV","10024":"VALLEY BLVD/RAYMOND AV","10025":"MAIN ST/PALM AV","10026":"MAIN ST/RAYMOND AV","10027":"COMMONWEALTH AV/RAYMOND AV","10028":"MAIN ST/MARENGO AV","10029":"COMMONWEALTH AV/MARENGO AV","10030":"VALLEY BLVD/MARENGO AV","10031":"MAIN ST/MARGUERITA AV","10033":"VALLEY BLVD/MARGUERITA AV","10034":"MAIN ST/ATLANTIC BLVD","10035":"COMMONWEALTH AV/ATLANTIC BLVD","10036":"VALLEY BLVD/ATLANTIC BLVD","10037":"MAIN ST/5TH ST","10039":"VALLEY BLVD/6TH ST","10040":"COMMONWEALTH AV/4TH ST","10041":"MAIN ST/2ND ST","10042":"WOODWARD AV/GARFIELD AV","10043":"MAIN ST/GARFIELD AV","10044":"COMMONWEALTH AV/2ND ST","10045":"VALLEY BLVD/4TH ST","10046":"GARFIELD AV/BAY STATE ST","10049":"MAIN ST/CHAPEL AV","10050":"VALLEY BLVD/GARFIELD AV","10051":"CHAPEL AV/BAY STATE ST&MAIN ST","10052":"CHAPEL AV/BAY STATE ST","10055":"ALMANSOR ST/CORTO ST","10056":"ALMANSOR ST/LOS HIGOS ST","10058":"VALLEY BLVD/ALMANSOR ST","10060":"VEGA ST/VALLEY BLVD"}}
const allRoutesId = 'all-routes-at-this-agency'
const allDirections = 'all-directions-on-this-route'

const analysisHours = []
for (var i = 4; i <= 25; i++) {
  analysisHours.push(i)
}

function getBackgroundColor(frequency) {
  if (frequency <= 15) {
    return '#B82630'
  } else if (frequency <= 29) {
    return '#A866A6'
  } else if (frequency <= 59) {
    return '#779ECE'
  } else if (frequency <= 60) {
    return '#89C57C'
  } else {
    return ''
  }
}

function makeSorter(key) {
  return (a, b) => {
    // first try to sort based off of numbers
    const akInt = parseInt(a[key])
    const bkInt = parseInt(b[key])
    if (akInt < bkInt) return -1
    if (akInt > bkInt) return 1
    // comparison could've been NaNs, so do again with strings
    const akStr = ('' + a[key]).toLowerCase()
    const bkStr = ('' + b[key]).toLowerCase()
    if (akStr < bkStr) return -1
    if (akStr > bkStr) return 1
    return 0
  }
}

const dateTypeOptions = [{
  text: 'Weekday',
  value: 'weekday'
}, {
  text: 'Saturday',
  value: 'saturday'
}, {
  text: 'Sunday',
  value: 'sunday'
}]

export default class Frequencies extends React.Component {
  componentWillMount() {
    this.setState({
      dateType: 'weekday',
      routeId: allRoutesId,
      routeOptions: this._getRouteOptions()
    })
  }

  // async componentDidMount() {
  //   agencyData = await fetch('/agency-data.json').then(res => res.json())
  //   this.setState({
  //     agencyOptions: agencyData.map((agency, idx) => {
  //       return {
  //         text: startCase(agency.agencyName),
  //         value: idx
  //       }
  //     }),
  //     routeOptions: this._getRouteOptions(agencyData[0])
  //   })
  // }

  _getRouteOptions() {
    const {dateType = 'weekday'} = this.state || {}
    const options = Object.entries(agencyData.debugDetails[dateType])
      .map(([routeId, {name}]) => {
        return {
          text: name,
          value: routeId
        }
      })
      .sort(makeSorter('text'))
    options.splice(0, 0, { text: 'All', value: allRoutesId })
    return options
  }

  _onDateTypeChange = (e) => {
    this.setState({
      dateType: e.target.value
    })
  }

  _onRouteChange = (e) => {
    const directionOptions = [{
      text: 'All directions',
      value: allDirections
    }]
    const {dateType} = this.state
    const routeId = e.target.value
    if (routeId !== allRoutesId) {
      Object.keys(agencyData.debugDetails[dateType][routeId].directions)
        .forEach(directionId => {
          directionOptions.push({
            text: directionId,
            value: directionId
          })
        })
    }

    this.setState({
      directionId: allDirections,
      directionOptions,
      routeId
    })
  }

  _onDirectionChange = (e) => {
    this.setState({
      directionId: e.target.value
    })
  }

  _getRouteRows() {
    if (!agencyData) return []
    return Object.values(agencyData.debugDetails[this.state.dateType])
      .sort(makeSorter('name'))
  }

  _getDirectionRows() {
    const {dateType, routeId} = this.state
    return Object.entries(agencyData.debugDetails[dateType][routeId].directions)
      .map(([directionId, {maxStopCountByHour}]) => {
        return {
          maxStopCountByHour,
          name: directionId
        }
      })
  }

  _getStopRows() {
    const {dateType, routeId, directionId} = this.state
    return Object.entries(agencyData.debugDetails[dateType][routeId].directions[directionId].stops)
      .map(([stopId, {stopCountByHour}]) => {
        return {
          maxStopCountByHour: stopCountByHour,
          name: agencyData.stopNames[stopId]
        }
      })
  }

  _renderTableBody() {
    const {routeId, directionId} = this.state
    let rows = []
    if (routeId === allRoutesId) {
      rows = this._getRouteRows()
    } else if (directionId === allDirections) {
      rows = this._getDirectionRows()
    } else {
      rows = this._getStopRows()
    }
    return rows.map((row, rowIdx) =>
      <tr key={`row-${rowIdx}`}>
        <td>{row.name}</td>
        {analysisHours.map((hour, analysisHourIdx) => {
          const stopCountByHour = row.maxStopCountByHour[hour]
          let stopText = ''
          const frequency = 60 / stopCountByHour
          if (stopCountByHour > 0) {
            stopText = Math.ceil(frequency)
          }
          return (
            <td
              key={`analysis-hour-val-${analysisHourIdx}`}
              style={{backgroundColor: getBackgroundColor(frequency)}}
              >
              {stopText}
            </td>
          )
        })}
      </tr>
    )
  }

  render() {
    const {
      dateType,
      routeId,
      routeOptions,
      directionId,
      directionOptions
    } = this.state
    const rowHeader = (
      routeId === allRoutesId
        ? 'Route'
        : directionId === allDirections
          ? 'Direction'
          : 'Stop'
    )
    return (
      <div>
        <div style={{ margin: 10 }}>
          <Select
            label='Date Type:'
            onChange={this._onDateTypeChange}
            options={dateTypeOptions}
            value={dateType}
            />
          <Select
            label='Route:'
            onChange={this._onRouteChange}
            options={routeOptions}
            value={routeId}
            />
          {routeId !== allRoutesId &&
            <Select
              label='Direction:'
              onChange={this._onDirectionChange}
              options={directionOptions}
              value={directionId}
              />
          }
        </div>
        <div>
          {[15, 29, 59, 60].map((headway, idx) =>
            <div
              key={`hour-legend-${idx}`}
              style={{float: 'left'}}
              >
              <span
                style={{
                  backgroundColor: getBackgroundColor(headway),
                  display: 'inline-block',
                  float: 'left',
                  height: 20,
                  margin: 10,
                  width: 20
                }}
                />
              <span style={{lineHeight: 3}}>
                {`${headway} minute headways or better`}
              </span>
            </div>
          )}
        </div>
        <div style={{ clear: 'both' }}>
          <Table bordered condensed>
            <thead>
              <tr>
                <th
                  rowSpan='2'
                  >
                  {rowHeader}
                </th>
                <th
                  colSpan={analysisHours.length}
                  style={{textAlign: 'center'}}
                  >
                  {upperFirst(dateType)}
                </th>
              </tr>
              <tr>
                {analysisHours.map((hour, idx) =>
                  <th key={`analysis-hour-${idx}`}>{hour}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {this._renderTableBody()}
            </tbody>
          </Table>
        </div>
      </div>
    )
  }
}

const Select = ({ label, onChange, options, value }) => {
  return (
    <FormGroup controlId={`${label}-formcontrol`}>
      <ControlLabel>{label}</ControlLabel>
      <FormControl
        componentClass="select"
        onChange={onChange}
        placeholder="select"
        value={value}
        >
        {options.map((option, idx) => (
          <option key={`label-${idx}`} value={option.value}>{option.text}</option>
        ))}
      </FormControl>
    </FormGroup>
  )
}
