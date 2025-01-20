class Graph:
    def __init__(self):
        self.adjacency_list = {}

    def add_vertex(self, vertex):
        if vertex not in self.adjacency_list:
            self.adjacency_list[vertex] = []

    def add_edge(self, vertex1, vertex2, direction):
        if vertex1 not in self.adjacency_list or vertex2 not in self.adjacency_list:
            raise ValueError("One or both vertices do not exist.")
        self.adjacency_list[vertex1].append({'node': vertex2, 'direction': direction})

    def find_all_paths(self, start, target, path=None, directions=None, visited=None):
        if path is None:
            path = []
        if directions is None:
            directions = []
        if visited is None:
            visited = set()

        path = path + [start]
        if start == target:
            return [{'path': path, 'directions': directions}]

        visited.add(start)
        all_paths = []
        for neighbor in self.adjacency_list.get(start, []):
            if neighbor['node'] not in visited:
                new_path = path[:]
                new_directions = directions[:]
                new_directions.append(neighbor['direction'])  # Add direction
                new_visited = visited.copy()
                paths_from_neighbor = self.find_all_paths(
                    neighbor['node'], target, new_path, new_directions, new_visited
                )
                all_paths.extend(paths_from_neighbor)

        visited.remove(start)
        return all_paths

    def find_shortest_paths(self, paths):
        if not paths:
            return []

        shortest_length = min(len(path['path']) for path in paths)

        paths_with_direction_changes = [
            {
                'path': path,
                'num_direction_changes': sum(
                    1 for i in range(1, len(path['directions']))
                    if path['directions'][i] != path['directions'][i - 1]
                )
            }
            for path in paths
        ]

        min_direction_changes = min(
            path['num_direction_changes'] for path in paths_with_direction_changes
            if len(path['path']['path']) == shortest_length
        )

        return [
            path for path in paths_with_direction_changes
            if len(path['path']['path']) == shortest_length and
            path['num_direction_changes'] == min_direction_changes
        ]
