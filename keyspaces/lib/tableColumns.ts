export const heatdata = [
    {
        columnName: 'creation_date',
        columnType: 'timestamp'
    },
    {
        columnName: 'lastid',
        columnType: 'uuid'
    },
    {
        columnName: 'nextid',
        columnType: 'uuid'
    },
    {
        columnName: 'lanes',
        columnType: 'list<text>'
    },
    {
        columnName: 'type',
        columnType: 'varchar'
    },
    {
        columnName: 'relaycount',
        columnType: 'varchar'
    },
    {
        columnName: 'event',
        columnType: 'varchar'
    },
    {
        columnName: 'heat',
        columnType: 'varchar'
    },
    {
        columnName: 'gender',
        columnType: 'varchar'
    },
    {
        columnName: 'round',
        columnType: 'varchar'
    },
    {
        columnName: 'swimstyle',
        columnType: 'varchar'
    },
    {
        columnName: 'distance',
        columnType: 'varchar'
    },
    {
        columnName: 'name',
        columnType: 'varchar'
    },
    {
        columnName: 'competition',
        columnType: 'varchar'
    }
]

/*
CREATE TABLE colorado.heatdata
( heatID uuid, creation_date timestamp, lastid uuid, nextid uuid, lanes list<text>, type varchar, relaycount varchar,
event varchar, heat varchar, gender varchar, round varchar, swimstyle varchar,
distance varchar, name varchar, competition varchar,
PRIMARY KEY ('heatID') )
*/

export const heatids = [
    {
        columnName: 'heatid',
        columnType: 'uuid'
    }
]

/*
CREATE TABLE colorado.heatids
( wkid int, creation_date timestamp, heatID uuid,
PRIMARY KEY (wkid, creation_date) ) 
WITH CLUSTERING ORDER BY (creation_date DESC)
;

*/