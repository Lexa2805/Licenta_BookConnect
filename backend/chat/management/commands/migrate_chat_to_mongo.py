from django.core.management.base import BaseCommand

from chat.models import ChatGroup, GroupMember, Message
from mongo_client import get_collection


GROUP_SOURCE = "sqlite:chat.ChatGroup"
MEMBER_SOURCE = "sqlite:chat.GroupMember"
MESSAGE_SOURCE = "sqlite:chat.Message"


class Command(BaseCommand):
    help = "Copy existing SQLite chat groups, members, and messages into MongoDB."

    def add_arguments(self, parser):
        parser.add_argument(
            "--base-url",
            default="http://127.0.0.1:8000",
            help="Base URL used to turn relative media URLs into absolute URLs.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would be copied without inserting MongoDB documents.",
        )

    def handle(self, *args, **options):
        base_url = options["base_url"].rstrip("/")
        dry_run = options["dry_run"]

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run enabled: no MongoDB documents will be inserted."))

        group_id_map, groups_copied = self.migrate_groups(dry_run)
        members_copied = self.migrate_members(group_id_map, dry_run)
        messages_copied = self.migrate_messages(group_id_map, base_url, dry_run)

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("SQLite chat migration complete."))
        self.stdout.write(f"chat_groups copied: {groups_copied}")
        self.stdout.write(f"chat_group_members copied: {members_copied}")
        self.stdout.write(f"chat_messages copied: {messages_copied}")

    def migrate_groups(self, dry_run):
        collection = get_collection("chat_groups")
        id_map = {}
        copied = 0

        for group in ChatGroup.objects.all().iterator():
            existing = collection.find_one(
                {"legacy_source": GROUP_SOURCE, "legacy_sqlite_id": str(group.pk)}
            )
            if existing:
                id_map[str(group.pk)] = str(existing["_id"])
                continue

            document = {
                "name": group.name,
                "description": group.description or "",
                "created_by": group.created_by or "",
                "created_at": group.created_at,
                "legacy_source": GROUP_SOURCE,
                "legacy_sqlite_id": str(group.pk),
            }
            if dry_run:
                copied += 1
                continue

            result = collection.insert_one(document)
            id_map[str(group.pk)] = str(result.inserted_id)
            copied += 1

        return id_map, copied

    def migrate_members(self, group_id_map, dry_run):
        collection = get_collection("chat_group_members")
        copied = 0

        for member in GroupMember.objects.select_related("group").all().iterator():
            group_id = group_id_map.get(str(member.group_id))
            if not group_id:
                continue

            if collection.find_one({"legacy_source": MEMBER_SOURCE, "legacy_sqlite_id": str(member.pk)}):
                continue

            document = {
                "group_id": group_id,
                "group": group_id,
                "user_id": member.user_id,
                "joined_at": member.joined_at,
                "legacy_source": MEMBER_SOURCE,
                "legacy_sqlite_id": str(member.pk),
            }
            if not dry_run:
                collection.insert_one(document)
            copied += 1

        return copied

    def migrate_messages(self, group_id_map, base_url, dry_run):
        collection = get_collection("chat_messages")
        copied = 0

        for message in Message.objects.all().iterator():
            if collection.find_one({"legacy_source": MESSAGE_SOURCE, "legacy_sqlite_id": str(message.pk)}):
                continue

            group_id = group_id_map.get(str(message.group_id)) if message.group_id else None
            attachment_path = message.attachment.name if message.attachment else None
            attachment_url = self.absolute_url(message.attachment.url, base_url) if message.attachment else None
            document = {
                "sender_id": message.sender_id,
                "sender_name": message.sender_name or "Anonymous",
                "group_id": group_id,
                "group": group_id,
                "receiver_id": message.receiver_id,
                "receiver_name": message.receiver_name,
                "content": message.content or "",
                "attachment_path": attachment_path,
                "attachment": attachment_path,
                "attachment_url": attachment_url,
                "attachment_name": message.attachment_name or "",
                "attachment_type": message.attachment_type or "",
                "attachment_size": message.attachment_size,
                "timestamp": message.timestamp,
                "is_read": message.is_read,
                "legacy_source": MESSAGE_SOURCE,
                "legacy_sqlite_id": str(message.pk),
            }
            if not dry_run:
                collection.insert_one(document)
            copied += 1

        return copied

    def absolute_url(self, url, base_url):
        if not url:
            return None
        if url.startswith(("http://", "https://")):
            return url
        return f"{base_url}{url}" if url.startswith("/") else f"{base_url}/{url}"
