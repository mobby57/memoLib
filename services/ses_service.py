# -*- coding: utf-8 -*-
import os
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class SESService:
    def __init__(self):
        self.client = boto3.client(
            'ses',
            region_name=os.getenv('AWS_REGION', 'eu-west-1'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        self.domain = os.getenv('SES_DOMAIN', 'votre-domaine.com')
    
    def envoyer_email(self, expediteur, destinataire, sujet, corps_html, reply_to=None):
        """Envoie un email via AWS SES"""
        try:
            response = self.client.send_email(
                Source=f"{expediteur}@{self.domain}",
                Destination={'ToAddresses': [destinataire]},
                Message={
                    'Subject': {'Data': sujet, 'Charset': 'UTF-8'},
                    'Body': {'Html': {'Data': corps_html, 'Charset': 'UTF-8'}}
                },
                ReplyToAddresses=[reply_to] if reply_to else []
            )
            logger.info(f"Email envoye via SES: {response['MessageId']}")
            return True, response['MessageId']
        except ClientError as e:
            logger.error(f"Erreur SES: {e.response['Error']['Message']}")
            return False, e.response['Error']['Message']
    
    def configurer_domaine(self, domaine):
        """Configure un domaine pour SES"""
        try:
            response = self.client.verify_domain_identity(Domain=domaine)
            token = response['VerificationToken']
            logger.info(f"Domaine {domaine} en verification. Token: {token}")
            return True, token
        except ClientError as e:
            logger.error(f"Erreur config domaine: {e.response['Error']['Message']}")
            return False, str(e)
    
    def creer_regle_reception(self, domaine, bucket_s3):
        """Crée une règle pour recevoir les emails"""
        try:
            rule_set = f"{domaine}-rules"
            self.client.create_receipt_rule_set(RuleSetName=rule_set)
            
            self.client.create_receipt_rule(
                RuleSetName=rule_set,
                Rule={
                    'Name': f'{domaine}-receive',
                    'Enabled': True,
                    'Recipients': [f'*@{domaine}'],
                    'Actions': [
                        {
                            'S3Action': {
                                'BucketName': bucket_s3,
                                'ObjectKeyPrefix': 'emails/'
                            }
                        }
                    ]
                }
            )
            logger.info(f"Regle de reception creee pour {domaine}")
            return True
        except ClientError as e:
            logger.error(f"Erreur regle reception: {e.response['Error']['Message']}")
            return False
