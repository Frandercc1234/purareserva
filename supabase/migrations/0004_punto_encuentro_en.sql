-- v1.1: punto de encuentro en inglés (si está vacío, se usa el español)
alter table tours add column punto_encuentro_en text not null default '';
