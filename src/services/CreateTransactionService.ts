import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoriesRepository = getRepository<Category>('categories');
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total - value < 0) {
      throw new AppError('Não há saldo suficiente para a transação.');
    }

    let categoryObject = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!categoryObject) {
      const createdCategory = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(createdCategory);

      categoryObject = createdCategory;
    }

    const createdTransaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id: categoryObject,
    });

    await transactionsRepository.save(createdTransaction);

    return createdTransaction;
  }
}

export default CreateTransactionService;
