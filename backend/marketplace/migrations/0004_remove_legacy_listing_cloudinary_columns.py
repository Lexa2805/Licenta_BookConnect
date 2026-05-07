from django.db import migrations


LEGACY_COLUMNS = {
    "image_url": "varchar(1000)",
    "image_public_id": "varchar(255)",
}


def _listing_columns(schema_editor):
    with schema_editor.connection.cursor() as cursor:
        return {
            column.name
            for column in schema_editor.connection.introspection.get_table_description(
                cursor,
                "marketplace_listing",
            )
        }


def remove_legacy_columns(apps, schema_editor):
    existing_columns = _listing_columns(schema_editor)

    for column_name in LEGACY_COLUMNS:
        if column_name in existing_columns:
            schema_editor.execute(
                f'ALTER TABLE "marketplace_listing" DROP COLUMN "{column_name}"'
            )


def restore_legacy_columns(apps, schema_editor):
    existing_columns = _listing_columns(schema_editor)

    for column_name, column_type in LEGACY_COLUMNS.items():
        if column_name not in existing_columns:
            schema_editor.execute(
                f'ALTER TABLE "marketplace_listing" '
                f'ADD COLUMN "{column_name}" {column_type} NOT NULL DEFAULT \'\''
            )


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0002_listing_language_listing_pages_alter_listing_image"),
    ]

    operations = [
        migrations.RunPython(remove_legacy_columns, restore_legacy_columns),
    ]
