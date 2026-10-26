function buildCategoryTree(categories) {
    const categoryMap = new Map();
    const roots = [];

    categories.forEach((category) => {
        categoryMap.set(category._id.toString(), {
            ...category,
            children: [],
        });
    });

    categories.forEach((category) => {
        const current = categoryMap.get(category._id.toString());

        if (!category.parentId) {
            roots.push(current);
            return;
        }

        const parent = categoryMap.get(category.parentId.toString());

        if (parent) {
            parent.children.push(current);
        }
    });

    return roots;
}

function getDescendantIds(categoryId, categories) {
    const descendantIds = [categoryId];

    const dfsSearch = (parentId) => {
        categories.forEach((category) => {
            if (
                category.parentId &&
                category.parentId.toString() === parentId.toString()
            ) {
                descendantIds.push(category._id.toString());
                dfsSearch(category._id);
            }
        });
    };
    dfsSearch(categoryId);
    return descendantIds;
}

function serializeCategory(category, isAdmin) {
    const result = {};
    if (isAdmin) {
        result._id = category._id;
    }
    result.title = category.title;
    result.slug = category.slug;
    if (category.icon) {
        result.icon = category.icon;
    }
    result.children = category.children.map((child) =>
        serializeCategory(child, isAdmin),
    );
    return result;
}
module.exports = { buildCategoryTree, getDescendantIds, serializeCategory };
