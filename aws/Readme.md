# AWS

## Policies IoT

Policy to publish and subscribe  
iot.policy.json

## IoT gerät erzeugen

in der oberfläche IoT core das gerät anlgen, Zertifikate herunterladen

## Konfiguration in datamapping

Domainkonfiguration -> URL a101aihtfyydn6-ats.iot.eu-central-1.amazonaws.com  
Dem Gerät die richtige Policy zuweisen!!!  
Regel wird vom script angelegt  
Im SQS kann die Warteschlange angeschaut werden - cdkmainchannel  
mapper_cloud=true in deploy auf RPI/colorado ergänzen, wenn alles klappt  
aws_install=true in deploy auf AWS, configs aus all.yml - keys aws  

```bash
ansible-playbook -i inventories/production/hosts testService.yml -e global_clean_all=false  --limit=rockpi-4b.fritz.box
```

Änderungen für env mapper, in roles zu finden

```bash
#DST_AWS_HOST='a101aihtfyydn6-ats.iot.eu-central-1.amazonaws.com'
#DST_AWS_KEYPATH='aws/colorado.private.key'
#DST_AWS_CERTPATH='aws/colorado.cert.pem'
#DST_AWS_CAPATH='aws/root-CA.crt'
#DST_AWS_CLIENTID='sdk-nodejs-d9122ba1-c0df-4470-a82f-6cd8b7c04e21'
```
