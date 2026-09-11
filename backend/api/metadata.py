from rest_framework.metadata import SimpleMetadata


class VerboseMetadata(SimpleMetadata):

    def get_field_info(self, field):
        info = super().get_field_info(field)
        
        if getattr(field, 'allow_null', False):
            info['allow_null'] = True
        if getattr(field, 'allow_blank', False):
            info['allow_blank'] = True

        return info
    