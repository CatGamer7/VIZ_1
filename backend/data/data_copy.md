# Neo4j APOC dumps:
```cypher
CALL apoc.export.csv.query("MATCH (c:Channel) RETURN c.channelID as id, c.joy_50 as joy, c.sadness_50 as sadness", "channels.csv", {});
```
```cypher
CALL apoc.export.csv.query("MATCH (e:Event) RETURN e.eventUID as id, e.duration_hours as duration, e.joy_50 as joy, e.sadness_50 as sadness", "events.csv", {});
```
```cypher
CALL apoc.export.csv.query("MATCH (m:Message) RETURN m.messageUID as id, m.channel_id_source as channel_id, m.event_id_ref as event_id, m.genre as genre, m.views_count as views", "messages.csv", {});
```
```cypher
CALL apoc.export.csv.query("MATCH (c1:Channel)-[r:INTERACTED_IN_EVENT]->(c2:Channel) RETURN c1.channelID as channel_id_1, c2.channelID as channel_id_2, r.weight_views as weight_views, r.weight_forwards as weight_forwards, r.weight_messages as weight_messages", "channel_connections.csv", {});
```
```cypher
CALL apoc.export.csv.query("MATCH (m:Message)-[r:REFERENCES]->(e:ExternalSource) RETURN m.messageUID as message_id, e.name as source_name LIMIT 100000", "sources.csv", {});
```
P.S. Data is saved to /var/lib/neo4j/import/
