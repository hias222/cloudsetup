import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export class SingleWebServerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = 'swimdata.de';
    const subDomainName = 'result.swimdata.de';

    // 1. Bestehende Route 53 Hosted Zone abrufen
    const hostedZone = route53.HostedZone.fromLookup(this, 'SwimdataHostedZone', {
      domainName: domainName,
    });

    // 2. VPC mit ausschließlich öffentlichen Subnets
    const vpc = new ec2.Vpc(this, 'SingleWebServerVpc', {
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // 3. Sicherheitsgruppe direkt für die EC2-Instanz
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'SingleWebServerEc2SG', {
      vpc,
      description: 'Erlaubt HTTP, HTTPS und SSH direkt aus dem Internet',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP for Let encrypt and traffic');
    ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic');
    ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH from everywhere');

    // 4. Bestehendes Key Pair referenzieren
    const keyPair = ec2.KeyPair.fromKeyPairName(this, 'Ec2KeyPair', 'ec2-key-pair');

    // 5. EC2-Instanz im öffentlichen Subnet erstellen (t4g.micro, ARM64 & Key Pair)
    const instance = new ec2.Instance(this, 'SingleWebServerInstance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023({
        cpuType: ec2.AmazonLinuxCpuType.ARM_64,
      }),
      securityGroup: ec2SecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      keyPair: keyPair, // Hier wird das Schlüsselpaar zugewiesen
    });

    // 6. Statische Elastische IP (EIP) anfordern und an die Instanz binden
    const eip = new ec2.CfnEIP(this, 'WebServerEIP');
    new ec2.CfnEIPAssociation(this, 'Ec2EIPAssoc', {
      allocationId: eip.attrAllocationId, // <-- Die korrekte, aktuelle Eigenschaft
      instanceId: instance.instanceId,
    });

    // 7. Route 53 A-Record direkt auf die EIP setzen
    new route53.ARecord(this, 'SingleWebServerARecord', {
      zone: hostedZone,
      recordName: 'result',
      target: route53.RecordTarget.fromIpAddresses(eip.ref),
    });

    // 8. User Data: Nginx, PHP-FPM und Certbot (Let's Encrypt) installieren
    instance.addUserData(
      'dnf update -y',

      // Nginx, PHP, PHP-FPM und Python3 für Certbot installieren
      'dnf install -y nginx php php-fpm php-mysqli php-json php-xml python3-pip',

      // Certbot via pip installieren
      'python3 -m venv /opt/certbot/',
      '/opt/certbot/bin/pip install --upgrade pip',
      '/opt/certbot/bin/pip install certbot certbot-nginx',
      'ln -s /opt/certbot/bin/certbot /usr/bin/certbot',

      // PHP-FPM Berechtigungen korrigieren
      "sed -i 's/user = apache/user = nginx/g' /etc/php-fpm.d/www.conf",
      "sed -i 's/group = apache/group = nginx/g' /etc/php-fpm.d/www.conf",

      // Temporäre Nginx-Konfiguration für Port 80 schreiben
      'cat << "EOF" > /etc/nginx/conf.d/php.conf',
      'server {',
      '    listen 80;',
      '    server_name result.swimdata.de;',
      '    root /usr/share/nginx/html;',
      '    index index.php index.html index.htm;',
      '    location / {',
      '        try_files $uri $uri/ =404;',
      '    }',
      '    location ~ \\.php$ {',
      '        include fastcgi_params;',
      '        fastcgi_pass unix:/run/php-fpm/www.sock;',
      '        fastcgi_index index.php;',
      '        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;',
      '    }',
      '}',
      'EOF',

      // Standard-Server-Block aus der nginx.conf entfernen
      "sed -i '/server {/,/^    }/d' /etc/nginx/nginx.conf",

      // PHP-Testdatei erstellen
      'echo "<?php phpinfo(); ?>" > /usr/share/nginx/html/index.php',
      'chown -R nginx:nginx /usr/share/nginx/html',

      // Dienste starten und aktivieren
      'systemctl start php-fpm',
      'systemctl enable php-fpm',
      'systemctl start nginx',
      'systemctl enable nginx',

      // Let's Encrypt Zertifikat anfordern (E-Mail anpassen!)
      'certbot --nginx --non-interactive --agree-tos --redirect -m admin@swimdata.de -d result.swimdata.de',

      // Täglicher Cronjob für die Zertifikatserneuerung
      'echo "0 3 * * * /usr/bin/certbot renew --quiet --post-hook \"systemctl reload nginx\"" > /etc/cron.d/certbot-renew'
    );

    new cdk.CfnOutput(this, 'WebUrl', {
      value: `https://${subDomainName}`,
      description: 'Die verschluesselte Let-Encrypt URL Ihres Nginx+PHP Webservers',
    });
  }
}
